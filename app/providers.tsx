'use client'

import { FavoritesProvider } from '@/components/favorites-provider'
import { LocaleProvider } from '@/components/locale-provider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <FavoritesProvider>{children}</FavoritesProvider>
    </LocaleProvider>
  )
}
