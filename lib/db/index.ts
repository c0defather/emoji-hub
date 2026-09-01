import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

type Client = ReturnType<typeof postgres>

// The Next.js dev server and the CLI scripts both re-evaluate this module, so
// the client is cached globally to avoid opening a new pool on every reload.
const globalForDb = globalThis as unknown as { emojiHubSql?: Client }

function createClient(): Client {
  const url = process.env.POSTGRES_URL
  if (!url) {
    throw new Error(
      'POSTGRES_URL is not set. Copy .env.example to .env and fill in your Neon connection string.'
    )
  }

  return postgres(url, {
    // Neon requires TLS. postgres-js checks `'ssl' in options` rather than the
    // value, so passing undefined here would suppress the URL's sslmode and
    // connect in the clear; only an explicit sslmode=disable may turn TLS off.
    ssl: /[?&]sslmode=disable(&|$)/.test(url) ? false : 'require',
    max: Number(process.env.POSTGRES_POOL_MAX ?? 5),
    idle_timeout: 20,
    connect_timeout: 15,
  })
}

let client: Client | undefined
let database: PostgresJsDatabase<typeof schema> | undefined

function getClient() {
  client ??= globalForDb.emojiHubSql ?? createClient()
  if (process.env.NODE_ENV !== 'production') globalForDb.emojiHubSql = client
  return client
}

// Both exports connect on first use rather than on import, so `next build`
// and tooling that only loads the module never need a reachable database.
export const sql = new Proxy(function () {} as unknown as Client, {
  apply: (_target, _thisArg, args) =>
    (getClient() as (...args: unknown[]) => unknown)(...args),
  get: (_target, property) => Reflect.get(getClient(), property),
})

export const db = new Proxy({} as PostgresJsDatabase<typeof schema>, {
  get: (_target, property) => {
    database ??= drizzle(getClient(), { schema })
    return Reflect.get(database, property)
  },
})

export * from './schema'
