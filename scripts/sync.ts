import 'dotenv/config'
import { sql } from '@/lib/db'
import { syncEmojis } from '@/lib/services/sync'

async function main() {
  const force = process.argv.includes('--force')
  const result = await syncEmojis({ trigger: 'manual', force })

  console.log(JSON.stringify(result, null, 2))
  await sql.end()
}

main().catch(async (error) => {
  console.error(error)
  await sql.end()
  process.exit(1)
})
