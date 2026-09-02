'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { isLocale, type Locale } from '@/lib/emoji'
import { BCP47, DICTIONARIES, type Dictionary } from '@/lib/i18n'

const STORAGE_KEY = 'emoji-hub.locale'

interface LocaleContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  /** UI copy for the active locale. */
  t: Dictionary
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  // The server has no way to know the stored preference, so the first render
  // is always English and the effect below swaps in the saved locale.
  const [locale, setStoredLocale] = useState<Locale>('en')

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (isLocale(stored)) setStoredLocale(stored)
    } catch {
      // Storage can be unavailable in private modes; English stays.
    }
  }, [])

  useEffect(() => {
    document.documentElement.lang = BCP47[locale]
  }, [locale])

  const setLocale = useCallback((next: Locale) => {
    setStoredLocale(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Preference just won't survive a reload.
    }
  }, [])

  const value = useMemo(
    () => ({ locale, setLocale, t: DICTIONARIES[locale] }),
    [locale, setLocale]
  )

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  )
}

export function useLocale() {
  const value = useContext(LocaleContext)
  if (!value) throw new Error('useLocale must be used inside <LocaleProvider>')
  return value
}
