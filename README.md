# Emoji Hub

A Next.js app that mirrors [emojihub.yurace.pro](https://emojihub.yurace.pro/api/all) into Postgres,
enriches every emoji with LLM-written descriptions, generational meanings and
example messages in English, Russian and Kazakh, and serves it over a browsable UI.

## How it works

1. **Daily sync** — `/api/cron/sync` fetches the full upstream catalogue (1791 emojis),
   hashes the payload, and does nothing if the hash matches the previous run. When
   something did change, only the affected rows are rewritten and their
   `content_version` is bumped.
2. **Enrichment** — `/api/cron/enrich` finds emojis with missing or stale translations
   and asks a model (through the Vercel AI Gateway) to write, per locale, a name, a
   description, a millennial meaning and a zoomer meaning, each with an example
   message. Emojis are batched `EMOJI_ENRICHMENT_BATCH_SIZE` per request, run
   `EMOJI_ENRICHMENT_CONCURRENCY` at a time and time-boxed so a run never exceeds the
   function limit; leftovers are picked up next run.
3. **Web app** — the browser downloads the whole catalogue from `/api/emojis` once and
   does all the searching, filtering and sorting locally.

## Web app

| Route | What it does |
| --- | --- |
| `/` | The browser: search, category filter, sorting, infinite grid |
| `/emoji/[id]` | Everything stored about one emoji, in the active language |
| `/favorites` | Emojis saved in this browser |

**One download, no round trips.** `lib/use-catalog.ts` fetches
`/api/emojis?locale=all` once per tab and keeps the result in a module level cache, so
navigating between pages never refetches. Every query after that runs in memory:

- **Search** matches the whole record, not just the name — id, English name, category,
  the glyph itself, unicode and HTML codes, plus the name, description, generational
  meanings and examples in all three languages. Multiple words must all match.
- **Filters and sorting** are plain array operations over the cached catalogue, with
  `Intl.Collator` for the active language.
- **Filters live in the URL** (`?q=&category=&sort=&dir=`), so a view can be
  shared or reached with the Back button.

**Language.** The switcher in the header picks between English, Russian and Kazakh and
stores the choice in `localStorage`. All three translations are already in memory, so
switching is instant. UI copy and the category labels live in `lib/i18n.ts`.

**Favorites** are a list of emoji ids in `localStorage` under `emoji-hub.favorites`,
kept in sync across tabs through the `storage` event. There is no account and nothing
is sent to the server, so `/favorites` has **Export** and **Import** buttons to move
them between browsers or keep a backup before the storage is cleared. Export downloads
a small JSON file; import merges it into what is already saved and never removes
anything, so restoring a stale backup is safe. Any JSON carrying a `favorites` array of
ids — or just a bare array — is accepted. See `lib/favorites-file.ts`.

## Setup

Requires Node 20+.

```bash
pnpm install
cp .env.example .env      # fill in POSTGRES_URL and AI_GATEWAY_API_KEY
pnpm db:migrate           # create tables
pnpm emojis:sync          # pull all 1791 emojis
pnpm emojis:enrich        # backfill translations (takes a while)
pnpm dev
```

### Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `POSTGRES_URL` | yes | Neon connection string used at runtime |
| `POSTGRES_URL_NON_POOLING` | for migrations | Direct connection used by drizzle-kit |
| `AI_GATEWAY_API_KEY` | for enrichment | [AI Gateway key](https://vercel.com/d?to=%2F%5Bteam%5D%2F~%2Fai-gateway%2Fapi-keys). Not needed on Vercel with OIDC |
| `CRON_SECRET` | in production | Shared secret guarding `/api/cron/*` |
| `EMOJI_ENRICHMENT_MODEL` | no | Defaults to `google/gemini-3.7-flash` |
| `EMOJI_ENRICHMENT_BATCH_SIZE` | no | Emojis per model call, default `8` |
| `EMOJI_ENRICHMENT_CONCURRENCY` | no | Parallel model calls, default `3` |
| `EMOJI_ENRICHMENT_MAX_ATTEMPTS` | no | Retries before an emoji is skipped, default `3` |
| `EMOJI_ENRICHMENT_DEBUG` | no | `1` logs the full prompt and response body for every call |

## API

The app only needs one endpoint, so that is all there is. Every route that nothing
called has been removed rather than kept around as an unused surface.

### `GET /api/emojis`

Returns the catalogue. There is no server-side search or category filter — the client
holds the whole thing and filters locally.

| Query param | Default | Notes |
| --- | --- | --- |
| `locale` | `all` | `en`, `ru`, `kz`, a comma-separated list, or `all` |
| `limit` | `5000` | 1–5000; high enough for the UI to pull the catalogue in one request |
| `offset` | `0` | Page start |

```jsonc
{
  "data": [
    {
      "id": "grinning-face-u-1f600",
      "character": "😀",
      "name": "grinning face",
      "category": "smileys and people",
      "htmlCode": ["&#128512;"],
      "unicode": ["U+1F600"],
      "enriched": true,
      "updatedAt": "2026-09-01T15:07:13.084Z",
      "translations": {
        "en": {
          "name": "grinning face",
          "description": "A yellow face with a wide open smile showing upper teeth.",
          "millennialMeaning": "…",
          "millennialExample": "Great catching up today! 😀",
          "zoomerMeaning": "…",
          "zoomerExample": "he really said that with his whole chest 😀",
          "model": "google/gemini-3.7-flash",
          "updatedAt": "2026-09-01T15:30:39.281Z"
        },
        "ru": { "…": "…" },
        "kz": { "…": "…" }
      }
    }
  ],
  "total": 1791,
  "limit": 5000,
  "offset": 0
}
```

### Cron endpoints

| Endpoint | Description |
| --- | --- |
| `GET\|POST /api/cron/sync` | Runs the sync. `?force=true` re-applies an unchanged payload |
| `GET\|POST /api/cron/enrich` | Runs one enrichment pass. `?limit=`, `?timeBudgetMs=`, `?force=true` |

The cron endpoints require `Authorization: Bearer $CRON_SECRET` (what Vercel Cron
sends) or an `x-cron-secret` header. Auth is skipped when `CRON_SECRET` is unset
outside production.

## Scheduling

`vercel.json` registers two daily cron jobs: the sync at 03:00 UTC and one
enrichment pass at 03:30 UTC. One pass handles the emojis that changed that day;
the initial backfill of all 1791 emojis is meant to be run once with
`pnpm emojis:enrich`. If you want the backfill to happen on the deployment
instead, lower the enrichment schedule to hourly — note that Hobby projects are
limited to one invocation per day per cron.

## Enrichment logs

Every model call logs a `[enrich]` line to stdout, which means the Vercel
runtime logs for cron runs and the terminal for CLI runs:

```
[enrich] request model=google/gemini-3.7-flash batch=8 emojis=[snake-u-1f40d, ...]
[enrich] response batch=8 results=8 tokens=612/5310 took=11.4s
[enrich] failed batch=8 took=1.5s emojis=[...] reason=...
```

A failure caused by an unparseable response also logs the raw body, since that
is the only way to tell a truncated answer apart from a model that ignored the
schema. Add `--verbose` (or set `EMOJI_ENRICHMENT_DEBUG=1`) to log the full
prompt and the full response body for every call.

Only unparseable responses count against an emoji's `MAX_ATTEMPTS` budget.
Missing credits, rate limits and provider outages are logged and retried on the
next run without marking the emoji as bad.

## Data model

- **`emojis`** — one row per upstream emoji. `id` is a slug of the name plus its
  unicode code points, which is the only unique combination the upstream API
  offers. `source_hash` detects per-emoji changes, `content_version` invalidates
  translations, `is_active` marks emojis that disappeared upstream.
- **`emoji_translations`** — `(emoji_id, locale)` primary key, holding the name,
  description, both generational meanings and their example messages, plus the model
  that wrote them and the `source_version` they were generated from. The example
  columns are nullable because they were added later; a null sends the emoji back
  through enrichment.
- **`sync_runs`** — audit trail with per-run counts, duration, payload hash and errors.

## Scripts

| Command | Description |
| --- | --- |
| `pnpm emojis:sync [--force]` | Run the sync from the CLI |
| `pnpm emojis:enrich [--limit=N] [--once] [--batch-size=N] [--concurrency=N] [--force] [--verbose]` | Enrich until nothing is pending |
| `pnpm db:generate` | Generate a migration from schema changes |
| `pnpm db:migrate` | Apply migrations |
| `pnpm db:studio` | Open Drizzle Studio |
| `pnpm typecheck` / `pnpm lint` | Static checks |
