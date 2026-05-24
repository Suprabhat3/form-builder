CREATE TYPE "public"."creator_notification_mode" AS ENUM('IMMEDIATE', 'DIGEST');--> statement-breakpoint
ALTER TABLE "form_public_settings"
  ADD COLUMN "creator_notifications_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "form_public_settings"
  ADD COLUMN "creator_notification_mode" "creator_notification_mode" DEFAULT 'IMMEDIATE' NOT NULL;--> statement-breakpoint
ALTER TABLE "form_public_settings"
  ADD COLUMN "creator_digest_interval_hours" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "form_public_settings"
  ADD COLUMN "last_digest_sent_at" timestamp with time zone;
