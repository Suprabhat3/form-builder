import crypto from "node:crypto";
import Razorpay from "razorpay";
import { and, count, eq } from "@repo/database";
import { db } from "@repo/database";
import { formsTable, paymentOrdersTable, usersTable } from "@repo/database/schema";
import { env } from "../env";
import type { PaidSubscriptionPlan, SubscriptionPlan } from "./model";
import {
  PLAN_CATALOG,
  PLAN_DURATION_DAYS,
  PLAN_PRICES_INR,
  amountInPaise,
  getEffectivePlan,
  getMaxFormsForPlan,
} from "./plans";

export class BillingError extends Error {
  constructor(
    message: string,
    public readonly code: "NOT_CONFIGURED" | "NOT_FOUND" | "FORBIDDEN" | "BAD_REQUEST" | "UNAUTHORIZED" = "BAD_REQUEST",
  ) {
    super(message);
    this.name = "BillingError";
  }
}

function getRazorpayClient(): Razorpay {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw new BillingError("Payments are not configured. Please add Razorpay credentials.", "NOT_CONFIGURED");
  }

  return new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET,
  });
}

function verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
  if (!env.RAZORPAY_KEY_SECRET) return false;
  const body = `${orderId}|${paymentId}`;
  const expected = crypto.createHmac("sha256", env.RAZORPAY_KEY_SECRET).update(body).digest("hex");
  return expected === signature;
}

function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  if (!env.RAZORPAY_WEBHOOK_SECRET) return false;
  const expected = crypto.createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest("hex");
  return expected === signature;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export class BillingService {
  public getPlanCatalog() {
    return PLAN_CATALOG.map((plan) => ({
      ...plan,
      features: [...plan.features],
    }));
  }

  public async getUserUsage(userId: string) {
    const userRows = await db
      .select({
        plan: usersTable.plan,
        planExpiresAt: usersTable.planExpiresAt,
      })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    const user = userRows[0];
    if (!user) {
      throw new BillingError("User not found", "NOT_FOUND");
    }

    const formCountRows = await db
      .select({ value: count() })
      .from(formsTable)
      .where(eq(formsTable.ownerId, userId));

    const formCount = Number(formCountRows[0]?.value ?? 0);
    const effectivePlan = getEffectivePlan(user.plan, user.planExpiresAt);
    const maxForms = getMaxFormsForPlan(user.plan, user.planExpiresAt);

    return {
      plan: effectivePlan,
      planExpiresAt: user.planExpiresAt?.toISOString() ?? null,
      maxForms,
      formCount,
      canCreateForm: formCount < maxForms,
    };
  }

  public async assertCanCreateForm(userId: string): Promise<void> {
    const usage = await this.getUserUsage(userId);
    if (!usage.canCreateForm) {
      throw new BillingError(
        `You've reached your limit of ${usage.maxForms} forms. Upgrade your plan to create more.`,
        "FORBIDDEN",
      );
    }
  }

  public async createCheckoutOrder(userId: string, plan: PaidSubscriptionPlan) {
    const priceInr = PLAN_PRICES_INR[plan];
    const amount = amountInPaise(priceInr);
    const razorpay = getRazorpayClient();

    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `plan_${plan.toLowerCase()}_${userId.slice(0, 8)}_${Date.now()}`,
      notes: {
        userId,
        plan,
      },
    });

    await db.insert(paymentOrdersTable).values({
      userId,
      plan,
      razorpayOrderId: order.id,
      amount,
      currency: "INR",
      status: "created",
    });

    return {
      orderId: order.id,
      amount,
      currency: "INR",
      keyId: env.RAZORPAY_KEY_ID!,
      plan,
    };
  }

  public async verifyAndActivatePlan(input: {
    userId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) {
    const isValid = verifyPaymentSignature(
      input.razorpayOrderId,
      input.razorpayPaymentId,
      input.razorpaySignature,
    );

    if (!isValid) {
      throw new BillingError("Invalid payment signature", "BAD_REQUEST");
    }

    const orderRows = await db
      .select()
      .from(paymentOrdersTable)
      .where(
        and(
          eq(paymentOrdersTable.razorpayOrderId, input.razorpayOrderId),
          eq(paymentOrdersTable.userId, input.userId),
        ),
      )
      .limit(1);

    const order = orderRows[0];
    if (!order) {
      throw new BillingError("Payment order not found", "NOT_FOUND");
    }

    if (order.status === "paid") {
      return this.getUserUsage(input.userId);
    }

    const paidAt = new Date();
    const planExpiresAt = addDays(paidAt, PLAN_DURATION_DAYS);

    await db
      .update(paymentOrdersTable)
      .set({
        status: "paid",
        razorpayPaymentId: input.razorpayPaymentId,
        paidAt,
      })
      .where(eq(paymentOrdersTable.id, order.id));

    await db
      .update(usersTable)
      .set({
        plan: order.plan,
        planExpiresAt,
        updatedAt: paidAt,
      })
      .where(eq(usersTable.id, input.userId));

    return this.getUserUsage(input.userId);
  }

  public async handleWebhook(rawBody: string, signature: string | undefined) {
    if (!env.RAZORPAY_WEBHOOK_SECRET) {
      return { handled: false, reason: "webhook_not_configured" };
    }

    if (!signature || !verifyWebhookSignature(rawBody, signature)) {
      throw new BillingError("Invalid webhook signature", "UNAUTHORIZED");
    }

    const payload = JSON.parse(rawBody) as {
      event?: string;
      payload?: {
        payment?: {
          entity?: {
            id?: string;
            order_id?: string;
            status?: string;
          };
        };
      };
    };

    if (payload.event !== "payment.captured") {
      return { handled: false };
    }

    const payment = payload.payload?.payment?.entity;
    if (!payment?.id || !payment.order_id || payment.status !== "captured") {
      return { handled: false };
    }

    const orderRows = await db
      .select()
      .from(paymentOrdersTable)
      .where(eq(paymentOrdersTable.razorpayOrderId, payment.order_id))
      .limit(1);

    const order = orderRows[0];
    if (!order || order.status === "paid") {
      return { handled: true };
    }

    const paidAt = new Date();
    const planExpiresAt = addDays(paidAt, PLAN_DURATION_DAYS);

    await db
      .update(paymentOrdersTable)
      .set({
        status: "paid",
        razorpayPaymentId: payment.id,
        paidAt,
      })
      .where(eq(paymentOrdersTable.id, order.id));

    await db
      .update(usersTable)
      .set({
        plan: order.plan,
        planExpiresAt,
        updatedAt: paidAt,
      })
      .where(eq(usersTable.id, order.userId));

    return { handled: true };
  }

  public enrichAuthUser(row: {
    id: string;
    email: string;
    name: string;
    image: string | null;
    emailVerified: boolean;
    role: "USER" | "ADMIN";
    plan: SubscriptionPlan;
    planExpiresAt: Date | null;
  }) {
    const effectivePlan = getEffectivePlan(row.plan, row.planExpiresAt);
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      image: row.image,
      emailVerified: row.emailVerified,
      role: row.role,
      plan: effectivePlan,
      planExpiresAt: row.planExpiresAt?.toISOString() ?? null,
      maxForms: getMaxFormsForPlan(row.plan, row.planExpiresAt),
    };
  }
}

export const billingService = new BillingService();

export const userAuthSelectFields = {
  id: usersTable.id,
  email: usersTable.email,
  name: usersTable.name,
  image: usersTable.image,
  emailVerified: usersTable.emailVerified,
  role: usersTable.role,
  plan: usersTable.plan,
  planExpiresAt: usersTable.planExpiresAt,
} as const;
