'use client'

import Link from 'next/link'
import { EmptyState } from '@/components/empty-state'
import { useLocale } from '@/components/locale-provider'

export default function EmojiNotFound() {
  const { t } = useLocale()

  return (
    <div className="pt-10">
      <EmptyState
        glyph="🫥"
        title={t.notFoundTitle}
        hint={t.notFoundHint}
        action={
          <Link
            href="/"
            className="mt-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            {t.browseAll}
          </Link>
        }
      />
    </div>
  )
}
