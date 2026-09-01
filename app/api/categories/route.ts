import { errorResponse, json } from '@/lib/http'
import { listCategories } from '@/lib/services/queries'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    return json({ data: await listCategories() })
  } catch (error) {
    return errorResponse(error)
  }
}
