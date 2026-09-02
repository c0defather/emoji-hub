import type { NextRequest } from 'next/server'
import {
  errorResponse,
  json,
  parseBoolean,
  parseInteger,
  parseLocales,
} from '@/lib/http'
import { listEmojis } from '@/lib/services/queries'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const result = await listEmojis({
      locales: parseLocales(searchParams),
      category: searchParams.get('category')?.trim() || undefined,
      group: searchParams.get('group')?.trim() || undefined,
      search: searchParams.get('search')?.trim() || undefined,
      enrichedOnly: parseBoolean(searchParams, 'enriched'),
      random: parseBoolean(searchParams, 'random'),
      limit: parseInteger(searchParams, 'limit', {
        fallback: 5000,
        min: 1,
        max: 5000,
      }),
      offset: parseInteger(searchParams, 'offset', {
        fallback: 0,
        min: 0,
        max: 100_000,
      }),
    })

    // The catalogue only moves once a day and the browser downloads all of it
    // on first paint, so it is worth letting the CDN hold on to the response.
    return json(result, {
      headers: {
        'Cache-Control':
          'public, max-age=0, s-maxage=300, stale-while-revalidate=86400',
      },
    })
  } catch (error) {
    return errorResponse(error)
  }
}
