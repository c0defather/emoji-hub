'use client'

import { useEffect, useRef, useState } from 'react'
import { useFavorites } from '@/components/favorites-provider'
import { DownloadIcon, UploadIcon } from '@/components/icons'
import { useLocale } from '@/components/locale-provider'
import {
  favoritesFileName,
  parseFavorites,
  serializeFavorites,
} from '@/lib/favorites-file'
import { cn } from '@/lib/utils'

const BUTTON =
  'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-slate-600 ring-1 ring-slate-900/10 transition hover:bg-white hover:text-slate-900 disabled:pointer-events-none disabled:opacity-40'

interface Result {
  tone: 'ok' | 'error'
  text: string
}

export function FavoritesTransfer() {
  const { favorites, importFavorites } = useFavorites()
  const { t } = useLocale()
  const fileInput = useRef<HTMLInputElement>(null)
  const [result, setResult] = useState<Result | null>(null)

  useEffect(() => {
    if (!result) return
    const timer = setTimeout(() => setResult(null), 5000)
    return () => clearTimeout(timer)
  }, [result])

  function exportFavorites() {
    const blob = new Blob([serializeFavorites(favorites)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = favoritesFileName()
    link.click()

    URL.revokeObjectURL(url)
  }

  async function onFileChosen(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    // Cleared so choosing the same file twice still fires a change event.
    event.target.value = ''
    if (!file) return

    try {
      const added = importFavorites(parseFavorites(await file.text()))
      setResult({ tone: 'ok', text: t.importAdded(added) })
    } catch {
      setResult({ tone: 'error', text: t.importFailed })
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {result && (
        <span
          role="status"
          className={cn(
            'text-sm font-medium',
            result.tone === 'ok' ? 'text-emerald-600' : 'text-rose-600'
          )}
        >
          {result.text}
        </span>
      )}

      <button
        type="button"
        onClick={exportFavorites}
        disabled={favorites.length === 0}
        title={t.exportTitle}
        className={BUTTON}
      >
        <DownloadIcon className="h-4 w-4" />
        {t.exportFavorites}
      </button>

      <button
        type="button"
        onClick={() => fileInput.current?.click()}
        title={t.importTitle}
        className={BUTTON}
      >
        <UploadIcon className="h-4 w-4" />
        {t.importFavorites}
      </button>

      <input
        ref={fileInput}
        type="file"
        accept="application/json,.json"
        onChange={onFileChosen}
        className="hidden"
      />
    </div>
  )
}
