'use client'

import Link from 'next/link'
import { FavoriteButton } from '@/components/favorite-button'
import { useLocale } from '@/components/locale-provider'
import { emojiName, type EmojiDto } from '@/lib/emoji'
import { groupLabel } from '@/lib/i18n'

export function EmojiCard({ emoji }: { emoji: EmojiDto }) {
  const { locale } = useLocale()

  return (
    <li className="group relative">
      <Link
        href={`/emoji/${emoji.id}`}
        className="card flex h-full flex-col items-center gap-2 p-4 text-center transition duration-150 hover:-translate-y-0.5 hover:bg-white hover:shadow-lg hover:ring-violet-500/20"
      >
        <span className="glyph text-[2.5rem]">{emoji.character}</span>
        <span className="line-clamp-2 text-[13px] font-medium leading-snug text-slate-800">
          {emojiName(emoji, locale)}
        </span>
        <span className="mt-auto line-clamp-1 text-[11px] text-slate-400">
          {groupLabel(emoji.group, locale)}
        </span>
      </Link>

      <FavoriteButton
        id={emoji.id}
        iconClassName="h-4 w-4"
        className="absolute right-1.5 top-1.5 h-7 w-7 bg-white/70 backdrop-blur-sm sm:opacity-0 sm:transition-opacity sm:focus-visible:opacity-100 sm:group-hover:opacity-100 sm:aria-pressed:opacity-100"
      />
    </li>
  )
}
