import { errorResponse, json } from '@/lib/http'
import { listGroups } from '@/lib/services/queries'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    return json({ data: await listGroups() })
  } catch (error) {
    return errorResponse(error)
  }
}
