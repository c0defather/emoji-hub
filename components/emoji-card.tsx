'use client'

import Link from 'next/link'
import { useDisplayMode, type DisplayMode } from '@/components/display-provider'
import { FavoriteButton } from '@/components/favorite-button'
import { useLocale } from '@/components/locale-provider'
import { emojiName, type EmojiDto } from '@/lib/emoji'
import { categoryLabel } from '@/lib/i18n'

/**
 * The glyph, or the source code behind it. Both variants occupy the same
 * height so switching modes doesn't reflow the grid.
 */
function Glyph({ emoji, mode }: { emoji: EmojiDto; mode: DisplayMode }) {
  if (mode === 'emoji') {
    return <span className="glyph text-[2.5rem]">{emoji.character}</span>
  }

  const code =
    mode === 'unicode' ? emoji.unicode.join(' ') : emoji.htmlCode.join(' ')

  return (
    <span
      title={emoji.character}
      className="flex h-10 items-center justify-center break-all px-1 text-center font-mono text-[11px] font-medium leading-tight text-violet-700"
    >
      {code}
    </span>
  )
}

export function EmojiCard({ emoji }: { emoji: EmojiDto }) {
  const { locale } = useLocale()
  const { mode } = useDisplayMode()

  const description = emoji.translations[locale]?.description

  return (
    <li className="group relative">
      <Link
        href={`/emoji/${emoji.id}`}
        className="card flex h-full flex-col items-center gap-2 p-4 text-center transition duration-150 hover:-translate-y-0.5 hover:bg-white hover:shadow-lg hover:ring-violet-500/20"
      >
        <Glyph emoji={emoji} mode={mode} />

        <span className="line-clamp-2 text-[13px] font-medium leading-snug text-slate-800">
          {emojiName(emoji, locale)}
        </span>

        {description && (
          <span className="line-clamp-2 text-[11px] leading-snug text-slate-500">
            {description}
          </span>
        )}

        <span className="mt-auto line-clamp-1 pt-0.5 text-[11px] text-slate-400">
          {categoryLabel(emoji.category, locale)}
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
