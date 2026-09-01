import { errorResponse, json } from '@/lib/http'
import { getStats } from '@/lib/services/queries'
import { countPendingEmojis } from '@/lib/services/enrich'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const [stats, pendingEnrichment] = await Promise.all([
      getStats(),
      countPendingEmojis(),
    ])

    return json({ ...stats, pendingEnrichment })
  } catch (error) {
    return errorResponse(error)
  }
}
