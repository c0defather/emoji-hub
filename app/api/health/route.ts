import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { json } from '@/lib/http'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await db.execute(sql`select 1`)
    return json({ status: 'ok', database: 'up', time: new Date().toISOString() })
  } catch (error) {
    return json(
      {
        status: 'degraded',
        database: 'down',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 503 }
    )
  }
}
