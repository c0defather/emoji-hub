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
  millennialExample: z
    .string()
    .min(1)
    .describe('A short message a millennial would send, containing the emoji'),
  zoomerMeaning: z
    .string()
    .min(1)
    .describe('How someone born 1997-2012 typically uses this emoji'),
  zoomerExample: z
    .string()
    .min(1)
    .describe('A short message a zoomer would send, containing the emoji'),
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
- millennialExample: one short message a millennial would really send, demonstrating that usage.
- zoomerMeaning: how Gen Z (born 1997-2012) actually use it. Mention ironic, sarcastic, or reappropriated usage when it exists.
- zoomerExample: one short message a zoomer would really send, demonstrating that usage.

Rules:
- Write natively in each language. Never transliterate English text, and never leave English words untranslated unless they are established loanwords.
- Kazakh must use the Cyrillic alphabet, and must be idiomatic Kazakh rather than a word-for-word rendering of the English.
- Keep name, description and the two meanings between 1 and 3 sentences. No markdown and no quotes around the whole value.
- Only the two example fields may contain emoji characters; the other fields must contain none.
- Each example is a single chat message under 12 words that includes the emoji itself, written the way that generation types: millennials punctuate properly, zoomers usually skip capitals and full stops. Do not label it or wrap it in quotes.
- The two examples must differ from each other, and must read as something a person would send rather than a definition.
- If a generation has no distinctive usage, describe the ordinary usage for that generation rather than saying it has none.
- Return one object in "results" for every input emoji, echoing its ref number.`

export function buildUserPrompt(batch: Emoji[]) {
  const lines = batch.map((emoji, index) =>
    [
      `ref: ${index + 1}`,
      `emoji: ${emoji.character}`,
      `english name: ${emoji.name}`,
      `category: ${emoji.category}`,
      `unicode: ${emoji.unicode.join(' ')}`,
    ].join('\n')
  )

  return `Write encyclopedia entries for the following ${batch.length} emoji.\n\n${lines.join('\n\n')}`
}
