import { z } from 'zod'
import type { Emoji } from '@/lib/db/schema'

const localeContentSchema = z.object({
  name: z.string().min(1).describe('Natural, human readable emoji name'),
  description: z
    .string()
    .min(1)
    .describe('One or two neutral sentences describing what the emoji depicts'),
  millennialMeaning: z
    .string()
    .min(1)
    .describe('How someone born 1981-1996 typically uses this emoji'),
  zoomerMeaning: z
    .string()
    .min(1)
    .describe('How someone born 1997-2012 typically uses this emoji'),
})

/**
 * Several emojis per request. Weaker models tend to drop the wrapper and emit a
 * bare object per emoji instead, which fails validation; the caller retries
 * those on progressively smaller batches.
 */
export const enrichmentSchema = z.object({
  results: z.array(
    z.object({
      ref: z
        .number()
        .int()
        .describe('The ref number of the emoji this entry belongs to'),
      en: localeContentSchema,
      ru: localeContentSchema,
      kz: localeContentSchema,
    })
  ),
})

export type EnrichmentPayload = z.infer<typeof enrichmentSchema>
export type LocaleContent = z.infer<typeof localeContentSchema>

export const SYSTEM_PROMPT = `You are a lexicographer of internet culture writing entries for an emoji encyclopedia.

For every emoji you receive, produce content in three languages:
- "en": English
- "ru": Russian (русский)
- "kz": Kazakh (қазақша, Cyrillic script)

For each language provide:
- name: the emoji's common name in that language, lowercase unless a proper noun.
- description: 1-2 sentences describing what the image literally shows. Neutral and factual.
- millennialMeaning: how millennials (born 1981-1996) actually use this emoji in messages. Mention the sincere, literal, or slightly earnest usage they are known for.
- zoomerMeaning: how Gen Z (born 1997-2012) actually use it. Mention ironic, sarcastic, or reappropriated usage when it exists.

Rules:
- Write natively in each language. Never transliterate English text, and never leave English words untranslated unless they are established loanwords.
- Kazakh must use the Cyrillic alphabet, and must be idiomatic Kazakh rather than a word-for-word rendering of the English.
- Keep every field between 1 and 3 sentences. No markdown, no emoji characters inside the text, no quotes around the whole value.
- If a generation has no distinctive usage, describe the ordinary usage for that generation rather than saying it has none.
- Return one object in "results" for every input emoji, echoing its ref number.`

export function buildUserPrompt(batch: Emoji[]) {
  const lines = batch.map((emoji, index) =>
    [
      `ref: ${index + 1}`,
      `emoji: ${emoji.character}`,
      `english name: ${emoji.name}`,
      `category: ${emoji.category}`,
      `group: ${emoji.group}`,
      `unicode: ${emoji.unicode.join(' ')}`,
    ].join('\n')
  )

  return `Write encyclopedia entries for the following ${batch.length} emoji.\n\n${lines.join('\n\n')}`
}
