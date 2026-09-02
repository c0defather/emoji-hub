import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { EmojiDetail } from '@/components/emoji-detail'
import { LOCALES } from '@/lib/emoji'
import { getEmoji } from '@/lib/services/queries'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

/** `generateMetadata` and the page itself both need the row; fetch it once. */
const loadEmoji = cache((id: string) => getEmoji(id, [...LOCALES]))

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params
  const emoji = await loadEmoji(decodeURIComponent(id))
  if (!emoji) return { title: 'Emoji not found' }

  return {
    title: `${emoji.character} ${emoji.name}`,
    description:
      emoji.translations.en?.description ?? `${emoji.name} — ${emoji.category}.`,
  }
}

export default async function EmojiPage({ params }: PageProps) {
  const { id } = await params
  const emoji = await loadEmoji(decodeURIComponent(id))
  if (!emoji) notFound()

  return <EmojiDetail emoji={emoji} />
}
