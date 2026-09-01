import {
  and,
  asc,
  count,
  desc,
  eq,
  exists,
  ilike,
  inArray,
  isNotNull,
  or,
  sql,
  type SQL,
} from 'drizzle-orm'
import { db } from '@/lib/db'
import {
  emojiTranslations,
  emojis,
  LOCALES,
  syncRuns,
  type Locale,
} from '@/lib/db/schema'

export interface EmojiTranslationDto {
  name: string
  description: string
  millennialMeaning: string
  zoomerMeaning: string
  model: string | null
  updatedAt: string
}

export interface EmojiDto {
  id: string
  character: string
  name: string
  category: string
  group: string
  htmlCode: string[]
  unicode: string[]
  enriched: boolean
  updatedAt: string
  translations: Partial<Record<Locale, EmojiTranslationDto>>
}

export interface ListEmojisParams {
  locales: Locale[]
  category?: string
  group?: string
  search?: string
  /** Only emojis that already have translations for every requested locale. */
  enrichedOnly?: boolean
  limit: number
  offset: number
  random?: boolean
}

export interface ListEmojisResult {
  data: EmojiDto[]
  total: number
  limit: number
  offset: number
}

function buildFilters({
  category,
  group,
  search,
  enrichedOnly,
  locales,
}: Pick<
  ListEmojisParams,
  'category' | 'group' | 'search' | 'enrichedOnly' | 'locales'
>) {
  const filters: (SQL | undefined)[] = [eq(emojis.isActive, true)]

  if (category) filters.push(eq(emojis.category, category))
  if (group) filters.push(eq(emojis.group, group))

  if (search) {
    const pattern = `%${search}%`
    filters.push(
      or(
        ilike(emojis.name, pattern),
        exists(
          db
            .select({ one: sql`1` })
            .from(emojiTranslations)
            .where(
              and(
                eq(emojiTranslations.emojiId, emojis.id),
                inArray(emojiTranslations.locale, locales),
                or(
                  ilike(emojiTranslations.name, pattern),
                  ilike(emojiTranslations.description, pattern)
                )
              )
            )
        )
      )
    )
  }

  if (enrichedOnly) {
    filters.push(isNotNull(emojis.enrichedAt))
  }

  return and(...filters.filter(Boolean))
}

async function translationsFor(emojiIds: string[], locales: Locale[]) {
  if (emojiIds.length === 0) return new Map<string, Map<Locale, EmojiTranslationDto>>()

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
    const bucket = byEmoji.get(row.emojiId) ?? new Map<Locale, EmojiTranslationDto>()
    bucket.set(row.locale, {
      name: row.name,
      description: row.description,
      millennialMeaning: row.millennialMeaning,
      zoomerMeaning: row.zoomerMeaning,
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
    group: row.group,
    htmlCode: row.htmlCode,
    unicode: row.unicode,
    enriched: row.enrichedAt !== null,
    updatedAt: row.updatedAt.toISOString(),
    translations: Object.fromEntries(translations ?? []),
  }
}

export async function listEmojis(
  params: ListEmojisParams
): Promise<ListEmojisResult> {
  const where = buildFilters(params)

  const [{ value: total }] = await db
    .select({ value: count() })
    .from(emojis)
    .where(where)

  const rows = await db
    .select()
    .from(emojis)
    .where(where)
    .orderBy(params.random ? sql`random()` : asc(emojis.id))
    .limit(params.limit)
    .offset(params.random ? 0 : params.offset)

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

async function facetCounts(column: typeof emojis.category | typeof emojis.group) {
  return db
    .select({ value: column, count: count() })
    .from(emojis)
    .where(eq(emojis.isActive, true))
    .groupBy(column)
    .orderBy(asc(column))
}

export function listCategories() {
  return facetCounts(emojis.category)
}

export function listGroups() {
  return db
    .select({
      category: emojis.category,
      value: emojis.group,
      count: count(),
    })
    .from(emojis)
    .where(eq(emojis.isActive, true))
    .groupBy(emojis.category, emojis.group)
    .orderBy(asc(emojis.category), asc(emojis.group))
}

export async function getStats() {
  const [totals] = await db
    .select({
      total: count(),
      active: sql<number>`count(*) filter (where ${emojis.isActive})::int`,
      enriched: sql<number>`count(*) filter (where ${emojis.enrichedAt} is not null)::int`,
    })
    .from(emojis)

  const perLocale = await db
    .select({ locale: emojiTranslations.locale, count: count() })
    .from(emojiTranslations)
    .groupBy(emojiTranslations.locale)

  const [lastSync] = await db
    .select()
    .from(syncRuns)
    .orderBy(desc(syncRuns.startedAt))
    .limit(1)

  return {
    emojis: totals,
    translations: Object.fromEntries(
      LOCALES.map((locale) => [
        locale,
        perLocale.find((row) => row.locale === locale)?.count ?? 0,
      ])
    ),
    lastSync: lastSync ?? null,
  }
}
