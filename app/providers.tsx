'use client'

import { DisplayProvider } from '@/components/display-provider'
import { FavoritesProvider } from '@/components/favorites-provider'
import { LocaleProvider } from '@/components/locale-provider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <FavoritesProvider>
        <DisplayProvider>{children}</DisplayProvider>
      </FavoritesProvider>
    </LocaleProvider>
  )
}
