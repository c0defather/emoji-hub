'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

const STORAGE_KEY = 'emoji-hub.favorites'

interface FavoritesContextValue {
  /** Emoji ids, most recently added first. */
  favorites: string[]
  isFavorite: (id: string) => boolean
  toggleFavorite: (id: string) => void
  /** Merges ids into the list without removing anything; returns how many were new. */
  importFavorites: (ids: string[]) => number
  /** False until localStorage has been read, so nothing renders a stale count. */
  ready: boolean
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null)

function read(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    if (!Array.isArray(parsed)) return []
    return parsed.filter((id): id is string => typeof id === 'string')
  } catch {
    return []
  }
}

function write(ids: string[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  } catch {
    // Favorites stay in memory for this session only.
  }
}

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setFavorites(read())
    setReady(true)

    // Keep other tabs of the same site in sync.
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) setFavorites(read())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((current) => {
      const next = current.includes(id)
        ? current.filter((entry) => entry !== id)
        : [id, ...current]

      write(next)
      return next
    })
  }, [])

  // Importing merges rather than replaces, so restoring a stale backup can
  // never drop favorites saved since it was taken.
  const importFavorites = useCallback(
    (ids: string[]) => {
      const known = new Set(favorites)
      const incoming = ids.filter((id) => !known.has(id))
      if (incoming.length === 0) return 0

      const next = [...incoming, ...favorites]
      write(next)
      setFavorites(next)
      return incoming.length
    },
    [favorites]
  )

  const value = useMemo(() => {
    const lookup = new Set(favorites)
    return {
      favorites,
      isFavorite: (id: string) => lookup.has(id),
      toggleFavorite,
      importFavorites,
      ready,
    }
  }, [favorites, ready, toggleFavorite, importFavorites])

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const value = useContext(FavoritesContext)
  if (!value) {
    throw new Error('useFavorites must be used inside <FavoritesProvider>')
  }
  return value
}
