CREATE TYPE "public"."user_role" AS ENUM('USER', 'ADMIN');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" "user_role" DEFAULT 'USER' NOT NULL;--> statement-breakpoint
ALTER TABLE "form_public_settings" ADD COLUMN "thank_you_title" varchar(180);--> statement-breakpoint
ALTER TABLE "form_public_settings" ADD COLUMN "thank_you_body" text;--> statement-breakpoint
ALTER TABLE "form_public_settings" ADD COLUMN "thank_you_cta_text" varchar(120);--> statement-breakpoint
ALTER TABLE "form_public_settings" ADD COLUMN "thank_you_cta_url" text;--> statement-breakpoint
CREATE TABLE "admin_audit_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "actor_user_id" uuid NOT NULL,
  "target_form_id" uuid,
  "action" varchar(80) NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_target_form_id_forms_id_fk" FOREIGN KEY ("target_form_id") REFERENCES "public"."forms"("id") ON DELETE set null ON UPDATE no action;
