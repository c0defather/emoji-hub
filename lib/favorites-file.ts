/**
 * Favorites live only in the visitor's browser, so they need a way to carry
 * them somewhere else before the storage is cleared. The export is a small
 * JSON file; the import deliberately accepts anything that carries a list of
 * ids, including a hand-written array.
 */

const FAVORITES_FILE_VERSION = 1

interface FavoritesFile {
  app: 'emoji-hub'
  type: 'favorites'
  version: number
  exportedAt: string
  favorites: string[]
}

export function serializeFavorites(ids: string[]): string {
  const payload: FavoritesFile = {
    app: 'emoji-hub',
    type: 'favorites',
    version: FAVORITES_FILE_VERSION,
    exportedAt: new Date().toISOString(),
    favorites: ids,
  }

  return `${JSON.stringify(payload, null, 2)}\n`
}

export function favoritesFileName(date = new Date()) {
  return `emoji-hub-favorites-${date.toISOString().slice(0, 10)}.json`
}

/** Throws when the file carries no recognisable list of ids. */
export function parseFavorites(raw: string): string[] {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('Not valid JSON')
  }

  const list = Array.isArray(parsed)
    ? parsed
    : (parsed as { favorites?: unknown } | null)?.favorites

  if (!Array.isArray(list)) {
    throw new Error('No "favorites" array found')
  }

  const seen = new Set<string>()
  const ids: string[] = []

  for (const entry of list) {
    if (typeof entry !== 'string') continue
    const id = entry.trim()
    if (!id || seen.has(id)) continue
    seen.add(id)
    ids.push(id)
  }

  return ids
}
