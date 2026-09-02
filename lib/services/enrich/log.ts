import type { LanguageModelUsage } from 'ai'
import type { Emoji } from '@/lib/db/schema'

/**
 * Set EMOJI_ENRICHMENT_DEBUG=1 to also log the full prompt and the full
 * response body. Read lazily so the CLI's --verbose flag can turn it on.
 */
function verbose() {
  const value = process.env.EMOJI_ENRICHMENT_DEBUG
  return value === '1' || value === 'true'
}

function names(batch: Emoji[]) {
  return batch.map((emoji) => emoji.id).join(', ')
}

function seconds(ms: number) {
  return `${(ms / 1000).toFixed(1)}s`
}

export function logRequest(batch: Emoji[], model: string, prompt: string) {
  console.log(
    `[enrich] request model=${model} batch=${batch.length} emojis=[${names(batch)}]`
  )
  if (verbose()) {
    console.log(`[enrich] prompt\n${prompt}`)
  }
}

export function logResponse(
  batch: Emoji[],
  usage: LanguageModelUsage,
  durationMs: number,
  results: number,
  body: unknown
) {
  console.log(
    `[enrich] response batch=${batch.length} results=${results} tokens=${usage.inputTokens ?? '?'}/${usage.outputTokens ?? '?'} took=${seconds(durationMs)}`
  )
  if (verbose()) {
    console.log(`[enrich] body\n${JSON.stringify(body, null, 2)}`)
  }
}

export function logFailure(
  batch: Emoji[],
  durationMs: number,
  message: string,
  rawText?: string
) {
  console.warn(
    `[enrich] failed batch=${batch.length} took=${seconds(durationMs)} emojis=[${names(batch)}] reason=${message.split('\n')[0]}`
  )
  // The unparsed body is the only way to tell a truncated response apart from
  // a model that ignored the schema, so it is logged even without --verbose.
  if (rawText) {
    const limit = verbose() ? rawText.length : 600
    console.warn(`[enrich] raw response\n${rawText.slice(0, limit)}`)
  }
}
