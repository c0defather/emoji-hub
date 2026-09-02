'use client'

import { useLocale } from '@/components/locale-provider'
import { LOCALES } from '@/lib/emoji'
import { LOCALE_LABELS } from '@/lib/i18n'
import { cn } from '@/lib/utils'

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useLocale()

  return (
    <div
      role="group"
      aria-label={t.language}
      className="flex items-center gap-0.5 rounded-full bg-slate-900/[0.06] p-0.5"
    >
      {LOCALES.map((option) => {
        const active = option === locale
        return (
          <button
            key={option}
            type="button"
            onClick={() => setLocale(option)}
            aria-pressed={active}
            title={LOCALE_LABELS[option].native}
            className={cn(
              'rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide transition',
              active
                ? 'bg-white text-violet-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            )}
          >
            {LOCALE_LABELS[option].short}
          </button>
        )
      })}
    </div>
  )
}
