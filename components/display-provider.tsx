'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

const STORAGE_KEY = 'emoji-hub.display'

/** How an emoji is rendered in the grid: as the glyph, or as its source code. */
export const DISPLAY_MODES = ['emoji', 'unicode', 'html'] as const
export type DisplayMode = (typeof DISPLAY_MODES)[number]

function isDisplayMode(value: unknown): value is DisplayMode {
  return (
    typeof value === 'string' &&
    (DISPLAY_MODES as readonly string[]).includes(value)
  )
}

interface DisplayContextValue {
  mode: DisplayMode
  setMode: (mode: DisplayMode) => void
}

const DisplayContext = createContext<DisplayContextValue | null>(null)

export function DisplayProvider({ children }: { children: React.ReactNode }) {
  // Same pattern as the locale: the server cannot know the stored preference,
  // so the first render is the default and the effect swaps in the saved one.
  const [mode, setStoredMode] = useState<DisplayMode>('emoji')

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (isDisplayMode(stored)) setStoredMode(stored)
    } catch {
      // Storage can be unavailable in private modes; the default stays.
    }
  }, [])

  const setMode = useCallback((next: DisplayMode) => {
    setStoredMode(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Preference just won't survive a reload.
    }
  }, [])

  const value = useMemo(() => ({ mode, setMode }), [mode, setMode])

  return (
    <DisplayContext.Provider value={value}>{children}</DisplayContext.Provider>
  )
}

export function useDisplayMode() {
  const value = useContext(DisplayContext)
  if (!value) throw new Error('useDisplayMode must be used inside <DisplayProvider>')
  return value
}
