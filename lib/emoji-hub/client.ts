import { createHash } from 'node:crypto'
import { z } from 'zod'

const EMOJI_HUB_ALL_URL = 'https://emojihub.yurace.pro/api/all'

const upstreamEmojiSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  /**
   * No longer stored, but still parsed and hashed: `sourceHash` is a
   * fingerprint of the upstream record, and dropping a field from it would
   * change every hash at once and send the whole catalogue back through
   * enrichment on the next sync.
   */
  group: z.string().min(1),
  htmlCode: z.array(z.string()).min(1),
  unicode: z.array(z.string()).min(1),
})

const upstreamPayloadSchema = z.array(upstreamEmojiSchema).min(1)

type UpstreamEmoji = z.infer<typeof upstreamEmojiSchema>

export interface NormalizedEmoji extends UpstreamEmoji {
  id: string
  character: string
  sourceHash: string
}

interface FetchResult {
  emojis: NormalizedEmoji[]
  /** Hash of the whole payload, used to detect that nothing changed upstream. */
  payloadHash: string
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Stable identifier: emoji name concatenated with its unicode code points. */
function buildEmojiId(name: string, unicode: string[]) {
  return slugify(`${name} ${unicode.join(' ')}`)
}

/** Turns `["U+1F466", "U+1F3FB"]` into the rendered glyph. */
function toCharacter(unicode: string[]) {
  const codePoints = unicode
    .flatMap((entry) => entry.trim().split(/\s+/))
    .map((entry) => Number.parseInt(entry.replace(/^U\+/i, ''), 16))
    .filter((code) => Number.isFinite(code))

  if (codePoints.length === 0) return ''

  try {
    return String.fromCodePoint(...codePoints)
  } catch {
    return ''
  }
}

function hash(value: string) {
  return createHash('sha256').update(value).digest('hex')
}

function normalizeEmoji(emoji: UpstreamEmoji): NormalizedEmoji {
  const sourceHash = hash(
    JSON.stringify([
      emoji.name,
      emoji.category,
      emoji.group,
      emoji.htmlCode,
      emoji.unicode,
    ])
  )

  return {
    ...emoji,
    id: buildEmojiId(emoji.name, emoji.unicode),
    character: toCharacter(emoji.unicode),
    sourceHash,
  }
}

export async function fetchAllEmojis(
  signal?: AbortSignal
): Promise<FetchResult> {
  const response = await fetch(EMOJI_HUB_ALL_URL, {
    headers: { accept: 'application/json' },
    cache: 'no-store',
    signal,
  })

  if (!response.ok) {
    throw new Error(
      `EmojiHub request failed: ${response.status} ${response.statusText}`
    )
  }

  const payload = upstreamPayloadSchema.parse(await response.json())
  const seen = new Set<string>()
  const emojis: NormalizedEmoji[] = []

  for (const entry of payload) {
    const normalized = normalizeEmoji(entry)
    // Upstream currently has no duplicates, but a collision would silently
    // overwrite a row during upsert, so drop repeats instead.
    if (seen.has(normalized.id)) continue
    seen.add(normalized.id)
    emojis.push(normalized)
  }

  const payloadHash = hash(
    emojis
      .map((emoji) => `${emoji.id}:${emoji.sourceHash}`)
      .sort()
      .join('|')
  )

  return { emojis, payloadHash }
}
