'use client'

import { useFavorites } from '@/components/favorites-provider'
import { useLocale } from '@/components/locale-provider'
import { HeartIcon } from '@/components/icons'
import { cn } from '@/lib/utils'

export function FavoriteButton({
  id,
  className,
  iconClassName,
}: {
  id: string
  className?: string
  iconClassName?: string
}) {
  const { isFavorite, toggleFavorite, ready } = useFavorites()
  const { t } = useLocale()

  const active = ready && isFavorite(id)
  const label = active ? t.removeFromFavorites : t.addToFavorites

  return (
    <button
      type="button"
      onClick={() => toggleFavorite(id)}
      aria-pressed={active}
      aria-label={label}
      title={label}
      className={cn(
        'grid place-items-center rounded-full transition',
        active
          ? 'text-rose-500 hover:text-rose-600'
          : 'text-slate-300 hover:text-rose-400',
        className
      )}
    >
      <HeartIcon filled={active} className={cn('h-5 w-5', iconClassName)} />
    </button>
  )
}
