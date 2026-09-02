'use client'

import { useEffect, useRef, useState } from 'react'
import { EmojiCard } from '@/components/emoji-card'
import type { EmojiDto } from '@/lib/emoji'

/** Cards added per batch; the full result set can be ~1800 items. */
const BATCH = 96

export function EmojiGrid({ emojis }: { emojis: EmojiDto[] }) {
  const [visible, setVisible] = useState(BATCH)
  const sentinel = useRef<HTMLDivElement>(null)

  useEffect(() => setVisible(BATCH), [emojis])

  useEffect(() => {
    if (visible >= emojis.length) return
    const node = sentinel.current
    if (!node) return

    // Recreated on every batch so its initial callback re-fires while the
    // sentinel is still on screen, which keeps long scrolls filling up.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible((count) => count + BATCH)
      },
      { rootMargin: '800px 0px' }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [visible, emojis.length])

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {emojis.slice(0, visible).map((emoji) => (
          <EmojiCard key={emoji.id} emoji={emoji} />
        ))}
      </ul>
      <div ref={sentinel} aria-hidden className="h-px" />
    </>
  )
}

export function EmojiGridSkeleton({ count = 24 }: { count?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {Array.from({ length: count }, (_, index) => (
        <li
          key={index}
          className="card flex h-[11rem] animate-pulse flex-col items-center justify-center gap-3 p-4"
        >
          <div className="h-9 w-9 rounded-full bg-slate-200/80" />
          <div className="h-2.5 w-16 rounded-full bg-slate-200/80" />
          <div className="h-2 w-20 rounded-full bg-slate-200/60" />
          <div className="h-2 w-14 rounded-full bg-slate-200/60" />
          <div className="h-2 w-10 rounded-full bg-slate-200/50" />
        </li>
      ))}
    </ul>
  )
}
