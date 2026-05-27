import { relations } from "drizzle-orm";
import { integer, pgEnum, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

export const subscriptionPlanEnum = pgEnum("subscription_plan", ["FREE", "STARTER", "PRO", "BUSINESS"]);

export const paymentOrdersTable = pgTable("payment_orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  plan: subscriptionPlanEnum("plan").notNull(),
  razorpayOrderId: varchar("razorpay_order_id", { length: 64 }).notNull().unique(),
  razorpayPaymentId: varchar("razorpay_payment_id", { length: 64 }),
  amount: integer("amount").notNull(),
  currency: varchar("currency", { length: 8 }).notNull().default("INR"),
  status: varchar("status", { length: 20 }).notNull().default("created"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  paidAt: timestamp("paid_at", { withTimezone: true }),
});

export const paymentOrdersRelations = relations(paymentOrdersTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [paymentOrdersTable.userId],
    references: [usersTable.id],
  }),
}));

export type SelectPaymentOrder = typeof paymentOrdersTable.$inferSelect;
export type InsertPaymentOrder = typeof paymentOrdersTable.$inferInsert;
export type SubscriptionPlan = (typeof subscriptionPlanEnum.enumValues)[number];
