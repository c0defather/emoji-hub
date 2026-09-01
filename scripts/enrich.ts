import 'dotenv/config'
import { sql } from '@/lib/db'
import { countPendingEmojis, enrichEmojis } from '@/lib/services/enrich'

function flag(name: string) {
  const match = process.argv.find((arg) => arg.startsWith(`--${name}=`))
  return match ? Number(match.split('=')[1]) : undefined
}

async function main() {
  const force = process.argv.includes('--force')
  const once = process.argv.includes('--once')
  const chunkSize = flag('limit') ?? 100

  const pending = await countPendingEmojis()
  console.log(`${pending} emoji(s) need enrichment`)

  let round = 0
  for (;;) {
    round += 1
    const result = await enrichEmojis({
      limit: chunkSize,
      batchSize: flag('batch-size'),
      concurrency: flag('concurrency'),
      timeBudgetMs: Number.MAX_SAFE_INTEGER,
      force,
    })

    console.log(
      `round ${round}: +${result.succeeded} ok, ${result.failed} failed, ${result.remaining} remaining (${Math.round(result.durationMs / 1000)}s)`
    )
    if (result.errors.length > 0) {
      console.warn('  errors:', result.errors.join(' | '))
    }

    const noProgress = result.succeeded === 0 && result.failed === 0
    if (once || force || noProgress || result.remaining === 0) break
  }

  await sql.end()
}

main().catch(async (error) => {
  console.error(error)
  await sql.end()
  process.exit(1)
})
