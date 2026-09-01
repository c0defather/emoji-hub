import type { NextRequest } from 'next/server'
import {
  assertCronAuthorized,
  errorResponse,
  json,
  parseBoolean,
  parseInteger,
} from '@/lib/http'
import { enrichEmojis } from '@/lib/services/enrich'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

/**
 * Generates the missing LLM copy. Each invocation works for a bounded amount
 * of time and leaves the rest for the next run, so a full backfill happens
 * across several runs instead of one request that times out.
 */
async function handle(request: NextRequest) {
  try {
    assertCronAuthorized(request)

    const { searchParams } = new URL(request.url)
    const result = await enrichEmojis({
      limit: parseInteger(searchParams, 'limit', {
        fallback: 120,
        min: 1,
        max: 2000,
      }),
      timeBudgetMs: parseInteger(searchParams, 'timeBudgetMs', {
        fallback: 240_000,
        min: 1_000,
        max: 280_000,
      }),
      force: parseBoolean(searchParams, 'force') ?? false,
      signal: request.signal,
    })

    return json(result)
  } catch (error) {
    return errorResponse(error)
  }
}

export const GET = handle
export const POST = handle
