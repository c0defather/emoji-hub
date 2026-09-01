import type { NextRequest } from 'next/server'
import { errorResponse, json, parseInteger } from '@/lib/http'
import { recentSyncRuns } from '@/lib/services/sync'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInteger(searchParams, 'limit', {
      fallback: 10,
      min: 1,
      max: 100,
    })

    return json({ data: await recentSyncRuns(limit) })
  } catch (error) {
    return errorResponse(error)
  }
}
