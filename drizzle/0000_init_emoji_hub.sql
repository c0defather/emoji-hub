CREATE TYPE "public"."locale" AS ENUM('en', 'ru', 'kz');--> statement-breakpoint
CREATE TYPE "public"."sync_status" AS ENUM('running', 'success', 'unchanged', 'failed');--> statement-breakpoint
CREATE TYPE "public"."sync_trigger" AS ENUM('cron', 'manual');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"image" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "emoji_translations" (
	"emoji_id" text NOT NULL,
	"locale" "locale" NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"millennial_meaning" text NOT NULL,
	"zoomer_meaning" text NOT NULL,
	"source_version" integer DEFAULT 1 NOT NULL,
	"model" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "emoji_translations_emoji_id_locale_pk" PRIMARY KEY("emoji_id","locale")
);
--> statement-breakpoint
CREATE TABLE "emojis" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"group" text NOT NULL,
	"html_code" text[] NOT NULL,
	"unicode" text[] NOT NULL,
	"character" text NOT NULL,
	"source_hash" text NOT NULL,
	"content_version" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"enriched_at" timestamp with time zone,
	"enrichment_attempts" integer DEFAULT 0 NOT NULL,
	"enrichment_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sync_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"trigger" "sync_trigger" DEFAULT 'cron' NOT NULL,
	"status" "sync_status" DEFAULT 'running' NOT NULL,
	"payload_hash" text,
	"fetched" integer DEFAULT 0 NOT NULL,
	"inserted" integer DEFAULT 0 NOT NULL,
	"updated" integer DEFAULT 0 NOT NULL,
	"deactivated" integer DEFAULT 0 NOT NULL,
	"reactivated" integer DEFAULT 0 NOT NULL,
	"duration_ms" integer,
	"error" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "emoji_translations" ADD CONSTRAINT "emoji_translations_emoji_id_emojis_id_fk" FOREIGN KEY ("emoji_id") REFERENCES "public"."emojis"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "unique_idx" ON "profiles" USING btree ("email");--> statement-breakpoint
CREATE INDEX "emoji_translations_locale_idx" ON "emoji_translations" USING btree ("locale");--> statement-breakpoint
CREATE INDEX "emojis_category_idx" ON "emojis" USING btree ("category");--> statement-breakpoint
CREATE INDEX "emojis_group_idx" ON "emojis" USING btree ("group");--> statement-breakpoint
CREATE INDEX "emojis_is_active_idx" ON "emojis" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "emojis_enriched_at_idx" ON "emojis" USING btree ("enriched_at");--> statement-breakpoint
CREATE INDEX "sync_runs_started_at_idx" ON "sync_runs" USING btree ("started_at");