import {
  generateText,
  NoObjectGeneratedError,
  Output,
  type LanguageModel,
} from 'ai'
import {
  and,
  asc,
  eq,
  getTableColumns,
  inArray,
  isNotNull,
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
import { logFailure, logRequest, logResponse } from './log'
import {
  buildUserPrompt,
  enrichmentSchema,
  SYSTEM_PROMPT,
  type LocaleContent,
} from './prompt'

const DEFAULT_MODEL =
  process.env.EMOJI_ENRICHMENT_MODEL ?? 'google/gemini-3.7-flash'

const DEFAULT_BATCH_SIZE = Number(process.env.EMOJI_ENRICHMENT_BATCH_SIZE ?? 8)
const DEFAULT_CONCURRENCY = Number(process.env.EMOJI_ENRICHMENT_CONCURRENCY ?? 3)
const MAX_ATTEMPTS = Number(process.env.EMOJI_ENRICHMENT_MAX_ATTEMPTS ?? 3)

/**
 * Eighteen fields per emoji, and Cyrillic costs roughly twice as many tokens as
 * Latin. Left unset, providers apply their own cap (4k is common) and silently
 * truncate the JSON mid-object, which surfaces as a parse failure.
 */
const OUTPUT_TOKENS_PER_EMOJI = 2200

interface EnrichOptions {
  /** Maximum number of emojis to enrich in this invocation. */
  limit?: number
  /** How many emojis to ask for in a single model call. */
  batchSize?: number
  /** How many batches to run in parallel. */
  concurrency?: number
  /** Stop starting new work once this much time has elapsed. */
  timeBudgetMs?: number
  model?: LanguageModel
  /** Re-generate translations that are already up to date. */
  force?: boolean
  signal?: AbortSignal
}

interface EnrichResult {
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
 * Emojis that are missing at least one complete locale for their current
 * content version. A bumped `content_version` from the sync job makes
 * previously enriched emojis show up here again, as does a translation written
 * before a field existed — hence the null check on the newest column.
 */
async function pendingEmojis(limit: number, force = false) {
  const query = db
    .select(getTableColumns(emojis))
    .from(emojis)
    .leftJoin(
      emojiTranslations,
      and(
        eq(emojiTranslations.emojiId, emojis.id),
        eq(emojiTranslations.sourceVersion, emojis.contentVersion),
        isNotNull(emojiTranslations.millennialExample)
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
        where t.emoji_id = e.id
          and t.source_version = e.content_version
          and t.millennial_example is not null
      ) < ${LOCALES.length}
  `)

  return Number(row?.count ?? 0)
}

function toTranslationRows(
  emoji: Emoji,
  byLocale: Record<Locale, LocaleContent>,
  model: string | null
): NewEmojiTranslation[] {
  return LOCALES.map((locale) => ({
    emojiId: emoji.id,
    locale,
    name: byLocale[locale].name.trim(),
    description: byLocale[locale].description.trim(),
    millennialMeaning: byLocale[locale].millennialMeaning.trim(),
    millennialExample: byLocale[locale].millennialExample.trim(),
    zoomerMeaning: byLocale[locale].zoomerMeaning.trim(),
    zoomerExample: byLocale[locale].zoomerExample.trim(),
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
        millennialExample: raw`excluded.millennial_example`,
        zoomerMeaning: raw`excluded.zoomer_meaning`,
        zoomerExample: raw`excluded.zoomer_example`,
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
  const prompt = buildUserPrompt(batch)
  logRequest(batch, modelId(model), prompt)

  const startedAt = Date.now()
  const { output, usage } = await generateText({
    model,
    system: SYSTEM_PROMPT,
    prompt,
    output: Output.object({ schema: enrichmentSchema }),
    maxOutputTokens: 1000 + OUTPUT_TOKENS_PER_EMOJI * batch.length,
    abortSignal: signal,
  })

  logResponse(batch, usage, Date.now() - startedAt, output.results.length, output)

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
 * Runs one batch, halving it and retrying when the model returns something
 * that doesn't fit the schema. Shorter responses are easier for a model to keep
 * well formed, and a single emoji only has to produce a bare object. Other
 * failures (rate limits, outages) are not worth splitting for.
 */
async function runBatch(
  batch: Emoji[],
  model: LanguageModel,
  signal?: AbortSignal
): Promise<{ succeeded: number; failed: number; errors: string[] }> {
  const startedAt = Date.now()

  try {
    const result = await enrichBatch(batch, model, signal)
    return { ...result, errors: [] }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const unparseable = NoObjectGeneratedError.isInstance(error)

    logFailure(
      batch,
      Date.now() - startedAt,
      message,
      unparseable ? error.text : undefined
    )

    if (!unparseable) {
      // Missing credits, rate limits and outages say nothing about the emoji,
      // so they must not burn its retry budget: a few such runs would
      // otherwise push every emoji past MAX_ATTEMPTS and hide it for good.
      return { succeeded: 0, failed: batch.length, errors: [message] }
    }

    if (batch.length > 1) {
      const half = Math.ceil(batch.length / 2)
      const [first, second] = await Promise.all([
        runBatch(batch.slice(0, half), model, signal),
        runBatch(batch.slice(half), model, signal),
      ])

      return {
        succeeded: first.succeeded + second.succeeded,
        failed: first.failed + second.failed,
        errors: [...first.errors, ...second.errors],
      }
    }

    await markFailed(
      batch.map((emoji) => emoji.id),
      message
    )
    return { succeeded: 0, failed: batch.length, errors: [message] }
  }
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

      const result = await runBatch(batch, model, signal)
      succeeded += result.succeeded
      failed += result.failed
      for (const message of result.errors) {
        if (errors.length < 5) errors.push(message)
      }
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.max(1, Math.min(concurrency, batches.length)) },
      worker
    )
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
