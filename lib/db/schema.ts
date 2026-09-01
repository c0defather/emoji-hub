import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { InferInsertModel, InferSelectModel, relations } from 'drizzle-orm'

/** Locales every emoji is translated into. */
export const LOCALES = ['en', 'ru', 'kz'] as const
export type Locale = (typeof LOCALES)[number]

export const localeEnum = pgEnum('locale', LOCALES)
export const syncStatusEnum = pgEnum('sync_status', [
  'running',
  'success',
  'unchanged',
  'failed',
])
export const syncTriggerEnum = pgEnum('sync_trigger', ['cron', 'manual'])

/**
 * Mirror of a record from https://emojihub.yurace.pro/api/all.
 *
 * `id` is a slug built from the emoji name plus its unicode code points, which
 * is the only combination the upstream API guarantees to be unique.
 */
export const emojis = pgTable(
  'emojis',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    category: text('category').notNull(),
    group: text('group').notNull(),
    htmlCode: text('html_code').array().notNull(),
    unicode: text('unicode').array().notNull(),
    /** Rendered glyph derived from `unicode`, stored so clients don't recompute it. */
    character: text('character').notNull(),
    /** Hash of the upstream record; a change means the emoji has to be re-enriched. */
    sourceHash: text('source_hash').notNull(),
    /** Bumped whenever `sourceHash` changes, so translations can detect staleness. */
    contentVersion: integer('content_version').notNull().default(1),
    /** False once the emoji disappears from the upstream feed. */
    isActive: boolean('is_active').notNull().default(true),
    enrichedAt: timestamp('enriched_at', { withTimezone: true }),
    enrichmentAttempts: integer('enrichment_attempts').notNull().default(0),
    enrichmentError: text('enrichment_error'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('emojis_category_idx').on(table.category),
    index('emojis_group_idx').on(table.group),
    index('emojis_is_active_idx').on(table.isActive),
    index('emojis_enriched_at_idx').on(table.enrichedAt),
  ]
)

/** LLM generated copy, one row per emoji per locale. */
export const emojiTranslations = pgTable(
  'emoji_translations',
  {
    emojiId: text('emoji_id')
      .notNull()
      .references(() => emojis.id, { onDelete: 'cascade' }),
    locale: localeEnum('locale').notNull(),
    name: text('name').notNull(),
    description: text('description').notNull(),
    millennialMeaning: text('millennial_meaning').notNull(),
    zoomerMeaning: text('zoomer_meaning').notNull(),
    /** Value of `emojis.content_version` when this text was generated. */
    sourceVersion: integer('source_version').notNull().default(1),
    model: text('model'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.emojiId, table.locale] }),
    index('emoji_translations_locale_idx').on(table.locale),
  ]
)

/** Audit trail for the daily upstream sync. */
export const syncRuns = pgTable(
  'sync_runs',
  {
    id: serial('id').primaryKey(),
    trigger: syncTriggerEnum('trigger').notNull().default('cron'),
    status: syncStatusEnum('status').notNull().default('running'),
    /** Hash of the whole upstream payload, used to skip unchanged responses. */
    payloadHash: text('payload_hash'),
    fetched: integer('fetched').notNull().default(0),
    inserted: integer('inserted').notNull().default(0),
    updated: integer('updated').notNull().default(0),
    deactivated: integer('deactivated').notNull().default(0),
    reactivated: integer('reactivated').notNull().default(0),
    durationMs: integer('duration_ms'),
    error: text('error'),
    startedAt: timestamp('started_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    finishedAt: timestamp('finished_at', { withTimezone: true }),
  },
  (table) => [index('sync_runs_started_at_idx').on(table.startedAt)]
)

export const emojisRelations = relations(emojis, ({ many }) => ({
  translations: many(emojiTranslations),
}))

export const emojiTranslationsRelations = relations(
  emojiTranslations,
  ({ one }) => ({
    emoji: one(emojis, {
      fields: [emojiTranslations.emojiId],
      references: [emojis.id],
    }),
  })
)

/** Table from the starter template, kept so the existing demo page still works. */
export const UsersTable = pgTable(
  'profiles',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    image: text('image').notNull(),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
  },
  (users) => [uniqueIndex('unique_idx').on(users.email)]
)

export type Emoji = InferSelectModel<typeof emojis>
export type NewEmoji = InferInsertModel<typeof emojis>
export type EmojiTranslation = InferSelectModel<typeof emojiTranslations>
export type NewEmojiTranslation = InferInsertModel<typeof emojiTranslations>
export type SyncRun = InferSelectModel<typeof syncRuns>
export type User = InferSelectModel<typeof UsersTable>
export type NewUser = InferInsertModel<typeof UsersTable>
