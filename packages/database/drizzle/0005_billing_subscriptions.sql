CREATE TYPE "public"."subscription_plan" AS ENUM('FREE', 'STARTER', 'PRO', 'BUSINESS');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "plan" "subscription_plan" DEFAULT 'FREE' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "plan_expires_at" timestamp with time zone;--> statement-breakpoint
CREATE TABLE "payment_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"plan" "subscription_plan" NOT NULL,
	"razorpay_order_id" varchar(64) NOT NULL,
	"razorpay_payment_id" varchar(64),
	"amount" integer NOT NULL,
	"currency" varchar(8) DEFAULT 'INR' NOT NULL,
	"status" varchar(20) DEFAULT 'created' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"paid_at" timestamp with time zone,
	CONSTRAINT "payment_orders_razorpay_order_id_unique" UNIQUE("razorpay_order_id")
);--> statement-breakpoint
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
