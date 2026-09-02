/**
 * The emoji shape as it crosses the network, plus the helpers both the server
 * queries and the browser bundle need. Kept free of database imports so client
 * components can use it.
 */

/** Locales every emoji is translated into. */
export const LOCALES = ['en', 'ru', 'kz'] as const
export type Locale = (typeof LOCALES)[number]

export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === 'string' && (LOCALES as readonly string[]).includes(value)
  )
}

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

/**
 * The translated name, falling back to the English name from upstream. Both
 * arrive lowercased, so the first letter is raised for display.
 */
export function emojiName(emoji: EmojiDto, locale: Locale): string {
  const name = emoji.translations[locale]?.name?.trim() || emoji.name
  return name.charAt(0).toUpperCase() + name.slice(1)
}

/**
 * Every piece of text on an emoji, flattened and lowercased so the browser can
 * match a query against the whole record instead of just the name.
 */
export function searchHaystack(emoji: EmojiDto): string {
  const parts: string[] = [
    emoji.id,
    emoji.name,
    emoji.category,
    emoji.group,
    emoji.character,
    ...emoji.unicode,
    ...emoji.htmlCode,
  ]

  for (const translation of Object.values(emoji.translations)) {
    if (!translation) continue
    parts.push(
      translation.name,
      translation.description,
      translation.millennialMeaning,
      translation.zoomerMeaning
    )
  }

  return parts.join(' ').toLowerCase()
}
