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

      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        // Favorites stay in memory for this session only.
      }

      return next
    })
  }, [])

  const value = useMemo(() => {
    const lookup = new Set(favorites)
    return {
      favorites,
      isFavorite: (id: string) => lookup.has(id),
      toggleFavorite,
      ready,
    }
  }, [favorites, ready, toggleFavorite])

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
