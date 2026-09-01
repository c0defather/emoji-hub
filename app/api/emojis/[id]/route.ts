import type { NextRequest } from 'next/server'
import { errorResponse, json, parseLocales } from '@/lib/http'
import { getEmoji } from '@/lib/services/queries'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const { searchParams } = new URL(request.url)

    const emoji = await getEmoji(id, parseLocales(searchParams))
    if (!emoji) {
      return json({ error: `No emoji with id "${id}"` }, { status: 404 })
    }

    return json(emoji)
  } catch (error) {
    return errorResponse(error)
  }
}
