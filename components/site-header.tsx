'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useFavorites } from '@/components/favorites-provider'
import { LanguageSwitcher } from '@/components/language-switcher'
import { useLocale } from '@/components/locale-provider'
import { HeartIcon } from '@/components/icons'
import { cn } from '@/lib/utils'

export function SiteHeader() {
  const { t } = useLocale()
  const { favorites, ready } = useFavorites()
  const onFavorites = usePathname() === '/favorites'

  return (
    <header className="sticky top-0 z-40 border-b border-white/70 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2.5 rounded-xl">
          <span className="glyph grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-sky-400 text-lg shadow-sm transition group-hover:scale-105">
            😀
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="text-[15px] font-semibold leading-tight tracking-tight">
              Emoji Hub
            </span>
            <span className="hidden truncate text-[11px] leading-tight text-slate-500 sm:block">
              {t.tagline}
            </span>
          </span>
        </Link>

        <nav className="ml-auto flex items-center gap-2 sm:gap-3">
          <Link
            href="/favorites"
            aria-current={onFavorites ? 'page' : undefined}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition',
              onFavorites
                ? 'bg-rose-50 text-rose-600 ring-1 ring-rose-200'
                : 'text-slate-600 hover:bg-slate-900/5 hover:text-slate-900'
            )}
          >
            <HeartIcon filled={onFavorites} className="h-4 w-4" />
            <span className="hidden sm:inline">{t.favorites}</span>
            {ready && favorites.length > 0 && (
              <span
                className={cn(
                  'min-w-[1.25rem] rounded-full px-1 text-center text-[11px] font-semibold leading-5',
                  onFavorites
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-900/[0.07] text-slate-600'
                )}
              >
                {favorites.length}
              </span>
            )}
          </Link>

          <LanguageSwitcher />
        </nav>
      </div>
    </header>
  )
}
