import { generateText, Output, type LanguageModel } from 'ai'
import {
  and,
  asc,
  eq,
  getTableColumns,
  inArray,
  lt,
  sql as raw,
  sql,
} from 'drizzle-orm'
import { db } from '@/lib/db'
import {
  emojiTranslations,
  emojis,
  LOCALES,
  type Emoji,
  type Locale,
  type NewEmojiTranslation,
} from '@/lib/db/schema'
import { chunk } from '@/lib/utils/chunk'
import {
  buildUserPrompt,
  enrichmentSchema,
  SYSTEM_PROMPT,
  type LocaleContent,
} from './prompt'

export const DEFAULT_MODEL =
  process.env.EMOJI_ENRICHMENT_MODEL ?? 'google/gemini-3.7-flash'

const DEFAULT_BATCH_SIZE = Number(process.env.EMOJI_ENRICHMENT_BATCH_SIZE ?? 8)
const DEFAULT_CONCURRENCY = Number(process.env.EMOJI_ENRICHMENT_CONCURRENCY ?? 3)
const MAX_ATTEMPTS = Number(process.env.EMOJI_ENRICHMENT_MAX_ATTEMPTS ?? 3)

export interface EnrichOptions {
  /** Maximum number of emojis to enrich in this invocation. */
  limit?: number
  batchSize?: number
  concurrency?: number
  /** Stop starting new batches once this much time has elapsed. */
  timeBudgetMs?: number
  model?: LanguageModel
  /** Re-generate translations that are already up to date. */
  force?: boolean
  signal?: AbortSignal
}

export interface EnrichResult {
  model: string
  attempted: number
  succeeded: number
  failed: number
  batches: number
  remaining: number
  durationMs: number
  stoppedEarly: boolean
  errors: string[]
}

/**
 * Emojis that are missing at least one locale for their current content
 * version. A bumped `content_version` from the sync job makes previously
 * enriched emojis show up here again.
 */
export async function pendingEmojis(limit: number, force = false) {
  const query = db
    .select(getTableColumns(emojis))
    .from(emojis)
    .leftJoin(
      emojiTranslations,
      and(
        eq(emojiTranslations.emojiId, emojis.id),
        eq(emojiTranslations.sourceVersion, emojis.contentVersion)
      )
    )
    .where(
      and(
        eq(emojis.isActive, true),
        force ? undefined : lt(emojis.enrichmentAttempts, MAX_ATTEMPTS)
      )
    )
    .groupBy(emojis.id)
    .orderBy(asc(emojis.enrichmentAttempts), asc(emojis.id))
    .limit(limit)

  if (force) return query

  return query.having(
    sql`count(${emojiTranslations.emojiId}) < ${LOCALES.length}`
  )
}

export async function countPendingEmojis() {
  const [row] = await db.execute<{ count: string }>(sql`
    select count(*)::text as count
    from ${emojis} e
    where e.is_active
      and e.enrichment_attempts < ${MAX_ATTEMPTS}
      and (
        select count(*)
        from ${emojiTranslations} t
        where t.emoji_id = e.id and t.source_version = e.content_version
      ) < ${LOCALES.length}
  `)

  return Number(row?.count ?? 0)
}

function toTranslationRows(
  emoji: Emoji,
  byLocale: Record<Locale, LocaleContent>,
  model: string
): NewEmojiTranslation[] {
  return LOCALES.map((locale) => ({
    emojiId: emoji.id,
    locale,
    name: byLocale[locale].name.trim(),
    description: byLocale[locale].description.trim(),
    millennialMeaning: byLocale[locale].millennialMeaning.trim(),
    zoomerMeaning: byLocale[locale].zoomerMeaning.trim(),
    sourceVersion: emoji.contentVersion,
    model,
  }))
}

async function persistTranslations(rows: NewEmojiTranslation[]) {
  if (rows.length === 0) return

  await db
    .insert(emojiTranslations)
    .values(rows)
    .onConflictDoUpdate({
      target: [emojiTranslations.emojiId, emojiTranslations.locale],
      set: {
        name: raw`excluded.name`,
        description: raw`excluded.description`,
        millennialMeaning: raw`excluded.millennial_meaning`,
        zoomerMeaning: raw`excluded.zoomer_meaning`,
        sourceVersion: raw`excluded.source_version`,
        model: raw`excluded.model`,
        updatedAt: new Date(),
      },
    })
}

async function markEnriched(ids: string[]) {
  if (ids.length === 0) return

  await db
    .update(emojis)
    .set({
      enrichedAt: new Date(),
      enrichmentAttempts: 0,
      enrichmentError: null,
      updatedAt: new Date(),
    })
    .where(inArray(emojis.id, ids))
}

async function markFailed(ids: string[], message: string) {
  if (ids.length === 0) return

  await db
    .update(emojis)
    .set({
      enrichmentAttempts: raw`${emojis.enrichmentAttempts} + 1`,
      enrichmentError: message.slice(0, 500),
      updatedAt: new Date(),
    })
    .where(inArray(emojis.id, ids))
}

function modelId(model: LanguageModel) {
  return typeof model === 'string' ? model : model.modelId
}

async function enrichBatch(
  batch: Emoji[],
  model: LanguageModel,
  signal?: AbortSignal
) {
  const { output } = await generateText({
    model,
    system: SYSTEM_PROMPT,
    prompt: buildUserPrompt(batch),
    output: Output.object({ schema: enrichmentSchema }),
    abortSignal: signal,
  })

  const byRef = new Map(output.results.map((result) => [result.ref, result]))
  const rows: NewEmojiTranslation[] = []
  const succeeded: string[] = []
  const missing: string[] = []

  batch.forEach((emoji, index) => {
    const result = byRef.get(index + 1)
    if (!result) {
      missing.push(emoji.id)
      return
    }

    rows.push(
      ...toTranslationRows(
        emoji,
        { en: result.en, ru: result.ru, kz: result.kz },
        modelId(model)
      )
    )
    succeeded.push(emoji.id)
  })

  await persistTranslations(rows)
  await markEnriched(succeeded)
  await markFailed(missing, 'Model returned no entry for this emoji')

  return { succeeded: succeeded.length, failed: missing.length }
}

/**
 * Generates descriptions and generational meanings for emojis that need them.
 *
 * Work is chunked so a single invocation stays inside a serverless time limit;
 * whatever is left over is picked up by the next run.
 */
export async function enrichEmojis(
  options: EnrichOptions = {}
): Promise<EnrichResult> {
  const {
    limit = 100,
    batchSize = DEFAULT_BATCH_SIZE,
    concurrency = DEFAULT_CONCURRENCY,
    timeBudgetMs = 45_000,
    model = DEFAULT_MODEL,
    force = false,
    signal,
  } = options

  const startedAt = Date.now()
  const candidates = await pendingEmojis(limit, force)
  const batches = chunk(candidates, batchSize)

  let succeeded = 0
  let failed = 0
  let processedBatches = 0
  let stoppedEarly = false
  const errors: string[] = []

  let cursor = 0
  const worker = async () => {
    while (cursor < batches.length) {
      if (Date.now() - startedAt > timeBudgetMs || signal?.aborted) {
        stoppedEarly = true
        return
      }

      const batch = batches[cursor++]
      processedBatches += 1

      try {
        const result = await enrichBatch(batch, model, signal)
        succeeded += result.succeeded
        failed += result.failed
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        failed += batch.length
        if (errors.length < 5) errors.push(message)
        await markFailed(
          batch.map((emoji) => emoji.id),
          message
        )
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.max(1, Math.min(concurrency, batches.length)) }, worker)
  )

  return {
    model: modelId(model),
    attempted: succeeded + failed,
    succeeded,
    failed,
    batches: processedBatches,
    remaining: await countPendingEmojis(),
    durationMs: Date.now() - startedAt,
    stoppedEarly,
    errors,
  }
}
