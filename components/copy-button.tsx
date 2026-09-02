'use client'

import { useEffect, useState } from 'react'
import { CheckIcon, CopyIcon } from '@/components/icons'
import { useLocale } from '@/components/locale-provider'
import { cn } from '@/lib/utils'

export function CopyButton({
  value,
  label,
}: {
  value: string
  /** Accessible name and button text; falls back to the generic "Copy". */
  label?: string
}) {
  const { t } = useLocale()
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 1600)
    return () => clearTimeout(timer)
  }, [copied])

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
    } catch {
      // Clipboard access can be denied; leave the button in its idle state.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={label ?? t.copy}
      title={copied ? t.copied : (label ?? t.copy)}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition',
        copied
          ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
          : 'text-slate-500 ring-1 ring-slate-900/10 hover:bg-white hover:text-slate-900'
      )}
    >
      {copied ? (
        <CheckIcon className="h-3.5 w-3.5" />
      ) : (
        <CopyIcon className="h-3.5 w-3.5" />
      )}
      <span>{copied ? t.copied : (label ?? t.copy)}</span>
    </button>
  )
}
