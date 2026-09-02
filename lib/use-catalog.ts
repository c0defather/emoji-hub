'use client'

import { useCallback, useEffect, useState } from 'react'
import type { EmojiDto } from '@/lib/emoji'

/** Comfortably above the 1791 emojis upstream ships, so one request is enough. */
const PAGE_SIZE = 2000

interface ListResponse {
  data: EmojiDto[]
  total: number
}

// The whole catalogue is small enough to keep in memory for the tab's lifetime:
// every page filters, sorts and searches over this one copy instead of asking
// the server again.
let resolved: EmojiDto[] | null = null
let inFlight: Promise<EmojiDto[]> | null = null

async function fetchCatalogue(): Promise<EmojiDto[]> {
  const all: EmojiDto[] = []

  for (let offset = 0; ; offset += PAGE_SIZE) {
    const response = await fetch(
      `/api/emojis?locale=all&limit=${PAGE_SIZE}&offset=${offset}`
    )
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`)
    }

    const page = (await response.json()) as ListResponse
    all.push(...page.data)

    if (page.data.length === 0 || all.length >= page.total) break
  }

  return all
}

function loadCatalogue(): Promise<EmojiDto[]> {
  if (resolved) return Promise.resolve(resolved)

  inFlight ??= fetchCatalogue().then(
    (emojis) => {
      resolved = emojis
      inFlight = null
      return emojis
    },
    (error) => {
      inFlight = null
      throw error
    }
  )

  return inFlight
}

export type CatalogStatus = 'loading' | 'ready' | 'error'

export function useCatalog() {
  const [emojis, setEmojis] = useState<EmojiDto[]>(() => resolved ?? [])
  const [status, setStatus] = useState<CatalogStatus>(() =>
    resolved ? 'ready' : 'loading'
  )
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (resolved) return

    let active = true
    setStatus('loading')

    loadCatalogue().then(
      (data) => {
        if (!active) return
        setEmojis(data)
        setStatus('ready')
      },
      (error) => {
        if (!active) return
        console.error('[catalog]', error)
        setStatus('error')
      }
    )

    return () => {
      active = false
    }
  }, [attempt])

  const retry = useCallback(() => setAttempt((value) => value + 1), [])

  return { emojis, status, retry }
}
