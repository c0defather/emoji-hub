'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { useFavorites } from '@/components/favorites-provider'
import { EmojiGrid, EmojiGridSkeleton } from '@/components/emoji-grid'
import { EmptyState } from '@/components/empty-state'
import { ArrowLeftIcon } from '@/components/icons'
import { useLocale } from '@/components/locale-provider'
import { useCatalog } from '@/lib/use-catalog'

export function FavoritesView() {
  const { t } = useLocale()
  const { favorites, ready } = useFavorites()
  const { emojis, status, retry } = useCatalog()

  // Favorites keep their "most recently added first" order; ids that no longer
  // exist upstream are dropped rather than rendered as blanks.
  const saved = useMemo(() => {
    const byId = new Map(emojis.map((emoji) => [emoji.id, emoji]))
    return favorites.flatMap((id) => byId.get(id) ?? [])
  }, [favorites, emojis])

  const loading = !ready || status === 'loading'

  return (
    <div>
      <section className="flex flex-wrap items-center justify-between gap-3 py-6 sm:py-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {t.favorites}
          </h1>
          <p className="mt-1.5 h-5 text-sm text-slate-500">
            {!loading && saved.length > 0 && t.showing(saved.length, saved.length)}
          </p>
        </div>
        <Link
          href="/"
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-900/5 hover:text-slate-900"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          {t.back}
        </Link>
      </section>

      {loading && <EmojiGridSkeleton count={12} />}

      {!loading && status === 'error' && (
        <EmptyState
          glyph="🛠️"
          title={t.loadFailed}
          action={
            <button
              type="button"
              onClick={retry}
              className="mt-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              {t.retry}
            </button>
          }
        />
      )}

      {!loading &&
        status === 'ready' &&
        (saved.length > 0 ? (
          <EmojiGrid emojis={saved} />
        ) : (
          <EmptyState
            glyph="💔"
            title={t.favoritesEmpty}
            hint={t.favoritesEmptyHint}
            action={
              <Link
                href="/"
                className="mt-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
              >
                {t.browseAll}
              </Link>
            }
          />
        ))}
    </div>
  )
}
