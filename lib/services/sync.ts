import { and, desc, eq, inArray, sql as raw } from 'drizzle-orm'
import { db } from '@/lib/db'
import { emojis, syncRuns, type NewEmoji, type SyncRun } from '@/lib/db/schema'
import { fetchAllEmojis, type NormalizedEmoji } from '@/lib/emoji-hub/client'
import { chunk } from '@/lib/utils/chunk'

const UPSERT_CHUNK_SIZE = 250

interface SyncOptions {
  trigger?: 'cron' | 'manual'
  /** Re-apply the upstream payload even when its hash is unchanged. */
  force?: boolean
  signal?: AbortSignal
}

type SyncResult = Pick<
  SyncRun,
  | 'id'
  | 'status'
  | 'payloadHash'
  | 'fetched'
  | 'inserted'
  | 'updated'
  | 'deactivated'
  | 'reactivated'
  | 'durationMs'
  | 'error'
>

async function lastCompletedRun() {
  const [run] = await db
    .select({ payloadHash: syncRuns.payloadHash })
    .from(syncRuns)
    .where(inArray(syncRuns.status, ['success', 'unchanged']))
    .orderBy(desc(syncRuns.startedAt))
    .limit(1)

  return run
}

function toRow(emoji: NormalizedEmoji): NewEmoji {
  return {
    id: emoji.id,
    name: emoji.name,
    category: emoji.category,
    htmlCode: emoji.htmlCode,
    unicode: emoji.unicode,
    character: emoji.character,
    sourceHash: emoji.sourceHash,
  }
}

/**
 * Pulls the full upstream catalogue and reconciles it with the local database.
 *
 * The whole payload is hashed first: when it matches the previous run nothing
 * is written and the run is recorded as `unchanged`. Otherwise only emojis
 * whose own hash moved are rewritten, and their `content_version` is bumped so
 * the enrichment job knows the existing translations went stale.
 */
export async function syncEmojis(
  options: SyncOptions = {}
): Promise<SyncResult> {
  const { trigger = 'cron', force = false, signal } = options
  const startedAt = Date.now()

  const [run] = await db
    .insert(syncRuns)
    .values({ trigger, status: 'running' })
    .returning({ id: syncRuns.id })

  const finish = async (
    result: Omit<SyncResult, 'id' | 'durationMs'>
  ): Promise<SyncResult> => {
    const durationMs = Date.now() - startedAt
    await db
      .update(syncRuns)
      .set({ ...result, durationMs, finishedAt: new Date() })
      .where(eq(syncRuns.id, run.id))

    return { id: run.id, durationMs, ...result }
  }

  try {
    const { emojis: upstream, payloadHash } = await fetchAllEmojis(signal)
    const previous = await lastCompletedRun()

    if (!force && previous?.payloadHash === payloadHash) {
      return finish({
        status: 'unchanged',
        payloadHash,
        fetched: upstream.length,
        inserted: 0,
        updated: 0,
        deactivated: 0,
        reactivated: 0,
        error: null,
      })
    }

    const existing = await db
      .select({
        id: emojis.id,
        sourceHash: emojis.sourceHash,
        isActive: emojis.isActive,
      })
      .from(emojis)

    const existingById = new Map(existing.map((row) => [row.id, row]))
    const upstreamIds = new Set(upstream.map((emoji) => emoji.id))

    const toInsert: NormalizedEmoji[] = []
    const toUpdate: NormalizedEmoji[] = []
    const toReactivate: string[] = []

    for (const emoji of upstream) {
      const current = existingById.get(emoji.id)
      if (!current) {
        toInsert.push(emoji)
      } else if (current.sourceHash !== emoji.sourceHash) {
        toUpdate.push(emoji)
      } else if (!current.isActive) {
        toReactivate.push(emoji.id)
      }
    }

    for (const batch of chunk(toInsert.map(toRow), UPSERT_CHUNK_SIZE)) {
      await db.insert(emojis).values(batch)
    }

    for (const batch of chunk(toUpdate.map(toRow), UPSERT_CHUNK_SIZE)) {
      await db
        .insert(emojis)
        .values(batch)
        .onConflictDoUpdate({
          target: emojis.id,
          set: {
            name: raw`excluded.name`,
            category: raw`excluded.category`,
            htmlCode: raw`excluded.html_code`,
            unicode: raw`excluded.unicode`,
            character: raw`excluded.character`,
            sourceHash: raw`excluded.source_hash`,
            contentVersion: raw`${emojis.contentVersion} + 1`,
            isActive: true,
            enrichmentAttempts: 0,
            enrichmentError: null,
            updatedAt: new Date(),
          },
        })
    }

    for (const batch of chunk(toReactivate, UPSERT_CHUNK_SIZE)) {
      await db
        .update(emojis)
        .set({ isActive: true, updatedAt: new Date() })
        .where(inArray(emojis.id, batch))
    }

    const staleIds = existing
      .filter((row) => row.isActive && !upstreamIds.has(row.id))
      .map((row) => row.id)

    for (const batch of chunk(staleIds, UPSERT_CHUNK_SIZE)) {
      await db
        .update(emojis)
        .set({ isActive: false, updatedAt: new Date() })
        .where(and(inArray(emojis.id, batch), eq(emojis.isActive, true)))
    }

    return finish({
      status: 'success',
      payloadHash,
      fetched: upstream.length,
      inserted: toInsert.length,
      updated: toUpdate.length,
      deactivated: staleIds.length,
      reactivated: toReactivate.length,
      error: null,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await finish({
      status: 'failed',
      payloadHash: null,
      fetched: 0,
      inserted: 0,
      updated: 0,
      deactivated: 0,
      reactivated: 0,
      error: message,
    })
    throw error
  }
}
