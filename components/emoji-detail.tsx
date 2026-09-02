'use client'

import Link from 'next/link'
import { CopyButton } from '@/components/copy-button'
import { FavoriteButton } from '@/components/favorite-button'
import { ArrowLeftIcon } from '@/components/icons'
import { useLocale } from '@/components/locale-provider'
import { emojiName, type EmojiDto } from '@/lib/emoji'
import { categoryLabel, formatDate } from '@/lib/i18n'

function Meaning({
  label,
  text,
  example,
  exampleLabel,
}: {
  label: string
  text: string
  example: string | null
  exampleLabel: string
}) {
  return (
    <div className="card flex flex-col p-5">
      <h2 className="text-[11px] font-semibold uppercase tracking-wider text-violet-600">
        {label}
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed text-slate-700">{text}</p>

      {example && (
        <figure className="mt-4">
          <figcaption className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
            {exampleLabel}
          </figcaption>
          <p className="mt-1.5 w-fit max-w-full rounded-2xl rounded-bl-md bg-slate-900/[0.04] px-3.5 py-2 text-[15px] leading-relaxed text-slate-700">
            {example}
          </p>
        </figure>
      )}
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-slate-900/5 py-2.5 last:border-0">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="text-sm font-medium text-slate-800">{children}</dd>
    </div>
  )
}

export function EmojiDetail({ emoji }: { emoji: EmojiDto }) {
  const { locale, t } = useLocale()

  const translation = emoji.translations[locale]
  const title = emojiName(emoji, locale)

  return (
    <article className="pb-8">
      <Link
        href="/"
        className="-ml-3 mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-900/5 hover:text-slate-900"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        {t.back}
      </Link>

      <header className="card mt-4 flex flex-col items-center gap-6 p-6 sm:flex-row sm:items-start sm:gap-8 sm:p-8">
        <div className="flex shrink-0 flex-col items-center gap-3">
          <div className="grid h-36 w-36 place-items-center rounded-3xl bg-gradient-to-br from-violet-100 via-white to-sky-100 ring-1 ring-slate-900/5">
            <span className="glyph text-7xl">{emoji.character}</span>
          </div>
          <CopyButton value={emoji.character} label={t.copyEmoji} />
        </div>

        <div className="min-w-0 flex-1 text-center sm:text-left">
          <div className="flex items-start justify-center gap-3 sm:justify-start">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              {title}
            </h1>
            <FavoriteButton
              id={emoji.id}
              className="mt-1 h-9 w-9 shrink-0 ring-1 ring-slate-900/10"
            />
          </div>

          {title.toLowerCase() !== emoji.name.toLowerCase() && (
            <p className="mt-1 text-sm text-slate-500">
              {t.originalName}: {emoji.name}
            </p>
          )}

          <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
            <Link
              href={`/?category=${encodeURIComponent(emoji.category)}`}
              className="rounded-full bg-slate-900/[0.04] px-3 py-1 text-xs font-medium text-slate-600 transition hover:bg-violet-600/10 hover:text-violet-700"
            >
              {categoryLabel(emoji.category, locale)}
            </Link>
          </div>

          {translation && (
            <p className="mt-5 text-[15px] leading-relaxed text-slate-700">
              {translation.description}
            </p>
          )}
        </div>
      </header>

      {translation ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Meaning
            label={t.millennialMeaning}
            text={translation.millennialMeaning}
            example={translation.millennialExample}
            exampleLabel={t.exampleLabel}
          />
          <Meaning
            label={t.zoomerMeaning}
            text={translation.zoomerMeaning}
            example={translation.zoomerExample}
            exampleLabel={t.exampleLabel}
          />
        </div>
      ) : (
        <p className="card mt-4 p-5 text-sm text-slate-500">
          {t.notTranslated}
        </p>
      )}

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">
          {t.details}
        </h2>
        <dl className="card px-5 py-2">
          <Row label={t.identifier}>
            <code className="text-[13px] text-slate-600">{emoji.id}</code>
          </Row>
          <Row label={t.category}>{categoryLabel(emoji.category, locale)}</Row>
          <Row label={t.unicode}>
            <span className="flex flex-wrap items-center justify-end gap-2">
              <code className="text-[13px] text-slate-600">
                {emoji.unicode.join(' ')}
              </code>
              <CopyButton value={emoji.unicode.join(' ')} />
            </span>
          </Row>
          <Row label={t.htmlCode}>
            <span className="flex flex-wrap items-center justify-end gap-2">
              <code className="text-[13px] text-slate-600">
                {emoji.htmlCode.join(' ')}
              </code>
              <CopyButton value={emoji.htmlCode.join(' ')} />
            </span>
          </Row>
          {translation?.model && (
            <Row label={t.writtenBy}>
              <code className="text-[13px] text-slate-600">
                {translation.model}
              </code>
            </Row>
          )}
          <Row label={t.updated}>{formatDate(emoji.updatedAt, locale)}</Row>
        </dl>
      </section>
    </article>
  )
}
