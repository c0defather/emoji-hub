import { and, asc, count, eq, inArray } from 'drizzle-orm'
import { db } from '@/lib/db'
import { emojiTranslations, emojis } from '@/lib/db/schema'
import type { EmojiDto, EmojiTranslationDto, Locale } from '@/lib/emoji'

interface ListEmojisParams {
  locales: Locale[]
  limit: number
  offset: number
}

interface ListEmojisResult {
  data: EmojiDto[]
  total: number
  limit: number
  offset: number
}

async function translationsFor(emojiIds: string[], locales: Locale[]) {
  if (emojiIds.length === 0) {
    return new Map<string, Map<Locale, EmojiTranslationDto>>()
  }

  const rows = await db
    .select()
    .from(emojiTranslations)
    .where(
      and(
        inArray(emojiTranslations.emojiId, emojiIds),
        inArray(emojiTranslations.locale, locales)
      )
    )

  const byEmoji = new Map<string, Map<Locale, EmojiTranslationDto>>()
  for (const row of rows) {
    const bucket =
      byEmoji.get(row.emojiId) ?? new Map<Locale, EmojiTranslationDto>()

    bucket.set(row.locale, {
      name: row.name,
      description: row.description,
      millennialMeaning: row.millennialMeaning,
      millennialExample: row.millennialExample,
      zoomerMeaning: row.zoomerMeaning,
      zoomerExample: row.zoomerExample,
      model: row.model,
      updatedAt: row.updatedAt.toISOString(),
    })
    byEmoji.set(row.emojiId, bucket)
  }

  return byEmoji
}

function toDto(
  row: typeof emojis.$inferSelect,
  translations: Map<Locale, EmojiTranslationDto> | undefined
): EmojiDto {
  return {
    id: row.id,
    character: row.character,
    name: row.name,
    category: row.category,
    htmlCode: row.htmlCode,
    unicode: row.unicode,
    enriched: row.enrichedAt !== null,
    updatedAt: row.updatedAt.toISOString(),
    translations: Object.fromEntries(translations ?? []),
  }
}

/**
 * One page of the catalogue. The browser asks for all of it in a single call
 * and then filters locally, so there is deliberately no server-side search or
 * category filter to keep in sync with the client.
 */
export async function listEmojis(
  params: ListEmojisParams
): Promise<ListEmojisResult> {
  const where = eq(emojis.isActive, true)

  const [{ value: total }] = await db
    .select({ value: count() })
    .from(emojis)
    .where(where)

  const rows = await db
    .select()
    .from(emojis)
    .where(where)
    .orderBy(asc(emojis.id))
    .limit(params.limit)
    .offset(params.offset)

  const translations = await translationsFor(
    rows.map((row) => row.id),
    params.locales
  )

  return {
    data: rows.map((row) => toDto(row, translations.get(row.id))),
    total,
    limit: params.limit,
    offset: params.offset,
  }
}

export async function getEmoji(id: string, locales: Locale[]) {
  const [row] = await db.select().from(emojis).where(eq(emojis.id, id)).limit(1)
  if (!row) return null

  const translations = await translationsFor([row.id], locales)
  return toDto(row, translations.get(row.id))
}
