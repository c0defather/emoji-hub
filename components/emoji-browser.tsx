'use client'

import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { EmojiGrid, EmojiGridSkeleton } from '@/components/emoji-grid'
import { EmptyState } from '@/components/empty-state'
import { CloseIcon, SearchIcon, SortIcon } from '@/components/icons'
import { useLocale } from '@/components/locale-provider'
import { SelectField } from '@/components/select-field'
import { emojiName, searchHaystack, type EmojiDto, type Locale } from '@/lib/emoji'
import { BCP47, categoryLabel } from '@/lib/i18n'
import { useCatalog } from '@/lib/use-catalog'
import { cn } from '@/lib/utils'

type SortKey = 'name' | 'category'
type Direction = 'asc' | 'desc'

const SORT_KEYS: SortKey[] = ['name', 'category']

function isSortKey(value: string | null): value is SortKey {
  return value !== null && (SORT_KEYS as string[]).includes(value)
}

function sortValue(emoji: EmojiDto, sort: SortKey, locale: Locale) {
  return sort === 'category'
    ? categoryLabel(emoji.category, locale)
    : emojiName(emoji, locale)
}

export function EmojiBrowser() {
  const { locale, t } = useLocale()
  const { emojis, status, retry } = useCatalog()

  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [sort, setSort] = useState<SortKey>('name')
  const [direction, setDirection] = useState<Direction>('asc')

  // Applied after mount rather than through `useSearchParams`, which would make
  // the whole page render as a Suspense fallback on the server.
  const restored = useRef(false)
  useEffect(() => {
    if (restored.current) return
    restored.current = true

    const params = new URLSearchParams(window.location.search)
    setQuery(params.get('q') ?? '')
    setCategory(params.get('category') ?? '')
    if (isSortKey(params.get('sort'))) setSort(params.get('sort') as SortKey)
    if (params.get('dir') === 'desc') setDirection('desc')
  }, [])

  const deferredQuery = useDeferredValue(query)
  const collator = useMemo(
    () => new Intl.Collator(BCP47[locale], { sensitivity: 'base', numeric: true }),
    [locale]
  )

  const indexed = useMemo(
    () =>
      emojis.map((emoji) => ({ emoji, haystack: searchHaystack(emoji) })),
    [emojis]
  )

  const categories = useMemo(() => {
    const counts = new Map<string, number>()
    for (const emoji of emojis) {
      counts.set(emoji.category, (counts.get(emoji.category) ?? 0) + 1)
    }
    return [...counts]
      .map(([value, count]) => ({
        value,
        label: `${categoryLabel(value, locale)} (${count})`,
      }))
      .sort((a, b) => collator.compare(a.label, b.label))
  }, [emojis, locale, collator])

  const results = useMemo(() => {
    const tokens = deferredQuery.trim().toLowerCase().split(/\s+/).filter(Boolean)

    const matched = indexed
      .filter(({ emoji, haystack }) => {
        if (category && emoji.category !== category) return false
        return tokens.every((token) => haystack.includes(token))
      })
      .map(({ emoji }) => emoji)

    const factor = direction === 'asc' ? 1 : -1
    return matched.sort((a, b) => {
      const primary =
        collator.compare(
          sortValue(a, sort, locale),
          sortValue(b, sort, locale)
        ) * factor
      return primary !== 0
        ? primary
        : collator.compare(emojiName(a, locale), emojiName(b, locale))
    })
  }, [indexed, category, deferredQuery, sort, direction, locale, collator])

  // Keep filters in the URL so a view can be shared or reached with Back.
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams()
      if (query.trim()) params.set('q', query.trim())
      if (category) params.set('category', category)
      if (sort !== 'name') params.set('sort', sort)
      if (direction !== 'asc') params.set('dir', direction)

      const search = params.toString()
      const next = search
        ? `${window.location.pathname}?${search}`
        : window.location.pathname

      if (next !== window.location.pathname + window.location.search) {
        window.history.replaceState(null, '', next)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, category, sort, direction])

  const filtered = Boolean(
    query || category || sort !== 'name' || direction !== 'asc'
  )

  function reset() {
    setQuery('')
    setCategory('')
    setSort('name')
    setDirection('asc')
  }

  return (
    <div>
      <section className="py-6 text-center sm:py-10">
        <h1 className="bg-gradient-to-br from-violet-600 via-slate-900 to-sky-600 bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-5xl">
          Emoji Hub
        </h1>
        <p className="mt-3 text-sm text-slate-600 sm:text-base">{t.tagline}</p>
      </section>

      <div className="card p-3 sm:p-4">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t.searchPlaceholder}
            aria-label={t.searchPlaceholder}
            className="h-12 w-full rounded-xl border-0 bg-slate-900/[0.04] pl-11 pr-11 text-[15px] text-slate-900 ring-1 ring-transparent transition placeholder:text-slate-400 focus:bg-white focus:ring-violet-500/40 [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label={t.clearSearch}
              title={t.clearSearch}
              className="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-slate-400 transition hover:bg-slate-900/5 hover:text-slate-700"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="mt-3 grid grid-cols-[repeat(2,minmax(0,1fr))_auto] items-end gap-3">
          <SelectField
            label={t.category}
            value={category}
            onChange={setCategory}
            options={[{ value: '', label: t.allCategories }, ...categories]}
          />
          <SelectField
            label={t.sortBy}
            value={sort}
            onChange={(value) => setSort(value as SortKey)}
            options={[
              { value: 'name', label: t.sortName },
              { value: 'category', label: t.sortCategory },
            ]}
          />
          <button
            type="button"
            onClick={() =>
              setDirection((value) => (value === 'asc' ? 'desc' : 'asc'))
            }
            title={direction === 'asc' ? t.ascending : t.descending}
            aria-label={direction === 'asc' ? t.ascending : t.descending}
            className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-white/80 px-3 text-sm font-semibold text-slate-600 shadow-sm ring-1 ring-slate-900/10 transition hover:text-slate-900 hover:ring-slate-900/20"
          >
            <SortIcon
              className={cn(
                'h-4 w-4 transition-transform',
                direction === 'desc' && 'rotate-180'
              )}
            />
            <span>{direction === 'asc' ? 'A–Z' : 'Z–A'}</span>
          </button>
        </div>
      </div>

      <div className="mb-3 mt-5 flex h-8 items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          {status === 'ready' ? t.showing(results.length, emojis.length) : ''}
        </p>
        {filtered && (
          <button
            type="button"
            onClick={reset}
            className="rounded-full px-3 py-1.5 text-sm font-medium text-violet-700 transition hover:bg-violet-600/10"
          >
            {t.reset}
          </button>
        )}
      </div>

      {status === 'loading' && <EmojiGridSkeleton />}

      {status === 'error' && (
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

      {status === 'ready' &&
        (results.length > 0 ? (
          <EmojiGrid emojis={results} />
        ) : (
          <EmptyState
            glyph="🔍"
            title={t.noResults}
            hint={t.noResultsHint}
            action={
              <button
                type="button"
                onClick={reset}
                className="mt-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
              >
                {t.reset}
              </button>
            }
          />
        ))}
    </div>
  )
}
