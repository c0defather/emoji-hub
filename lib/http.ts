import { NextResponse } from 'next/server'
import { LOCALES, type Locale } from '@/lib/db/schema'

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export function json<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init)
}

export function errorResponse(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status }
    )
  }

  const message = error instanceof Error ? error.message : 'Unexpected error'
  console.error('[api]', error)
  return NextResponse.json({ error: message }, { status: 500 })
}

/**
 * `?locale=ru`, `?locale=en,ru` and `?locale=all` are all accepted; anything
 * unrecognised is rejected so typos don't silently return empty translations.
 */
export function parseLocales(searchParams: URLSearchParams): Locale[] {
  const value = searchParams.get('locale')?.trim().toLowerCase()
  if (!value || value === 'all') return [...LOCALES]

  const requested = value.split(',').map((part) => part.trim())
  const invalid = requested.filter(
    (part) => !LOCALES.includes(part as Locale)
  )

  if (invalid.length > 0) {
    throw new ApiError(
      400,
      `Unsupported locale(s): ${invalid.join(', ')}. Use ${LOCALES.join(', ')} or all.`
    )
  }

  return requested as Locale[]
}

export function parseInteger(
  searchParams: URLSearchParams,
  key: string,
  { fallback, min, max }: { fallback: number; min: number; max: number }
) {
  const value = searchParams.get(key)
  if (value === null) return fallback

  const parsed = Number(value)
  if (!Number.isInteger(parsed)) {
    throw new ApiError(400, `${key} must be an integer`)
  }
  if (parsed < min || parsed > max) {
    throw new ApiError(400, `${key} must be between ${min} and ${max}`)
  }

  return parsed
}

export function parseBoolean(searchParams: URLSearchParams, key: string) {
  const value = searchParams.get(key)
  if (value === null) return undefined
  return value === '' || value === 'true' || value === '1'
}

/**
 * Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. The same secret is
 * accepted via `x-cron-secret` so the endpoints can be triggered by hand.
 */
export function assertCronAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new ApiError(500, 'CRON_SECRET is not configured')
    }
    return
  }

  const header = request.headers.get('authorization')
  const provided =
    header?.replace(/^Bearer\s+/i, '') ?? request.headers.get('x-cron-secret')

  if (provided !== secret) {
    throw new ApiError(401, 'Unauthorized')
  }
}
