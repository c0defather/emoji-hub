DROP INDEX "emojis_group_idx";--> statement-breakpoint
ALTER TABLE "emoji_translations" ADD COLUMN "millennial_example" text;--> statement-breakpoint
ALTER TABLE "emoji_translations" ADD COLUMN "zoomer_example" text;--> statement-breakpoint
ALTER TABLE "emojis" DROP COLUMN "group";