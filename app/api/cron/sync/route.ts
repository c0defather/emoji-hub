import type { NextRequest } from 'next/server'
import { assertCronAuthorized, errorResponse, json, parseBoolean } from '@/lib/http'
import { syncEmojis } from '@/lib/services/sync'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

/** Daily job: pull https://emojihub.yurace.pro/api/all and apply any changes. */
async function handle(request: NextRequest) {
  try {
    assertCronAuthorized(request)

    const { searchParams } = new URL(request.url)
    const result = await syncEmojis({
      trigger: request.headers.get('x-vercel-cron') ? 'cron' : 'manual',
      force: parseBoolean(searchParams, 'force') ?? false,
    })

    return json(result)
  } catch (error) {
    return errorResponse(error)
  }
}

export const GET = handle
export const POST = handle
