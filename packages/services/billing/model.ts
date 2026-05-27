import { z } from "zod";

export const subscriptionPlanSchema = z.enum(["FREE", "STARTER", "PRO", "BUSINESS"]);

export const paidSubscriptionPlanSchema = z.enum(["STARTER", "PRO", "BUSINESS"]);

export const createCheckoutOrderInputSchema = z.object({
  plan: paidSubscriptionPlanSchema,
});

export const verifyPaymentInputSchema = z.object({
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

export const planCatalogItemSchema = z.object({
  id: subscriptionPlanSchema,
  name: z.string(),
  priceInr: z.number().int().nonnegative(),
  maxForms: z.number().int().positive(),
  description: z.string(),
  features: z.array(z.string()),
  popular: z.boolean().optional(),
});

export const checkoutOrderOutputSchema = z.object({
  orderId: z.string(),
  amount: z.number().int().positive(),
  currency: z.string(),
  keyId: z.string(),
  plan: paidSubscriptionPlanSchema,
});

export const usageOutputSchema = z.object({
  plan: subscriptionPlanSchema,
  planExpiresAt: z.string().datetime().nullable(),
  maxForms: z.number().int().positive(),
  formCount: z.number().int().nonnegative(),
  canCreateForm: z.boolean(),
});

export type SubscriptionPlan = z.infer<typeof subscriptionPlanSchema>;
export type PaidSubscriptionPlan = z.infer<typeof paidSubscriptionPlanSchema>;
export type CreateCheckoutOrderInput = z.infer<typeof createCheckoutOrderInputSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentInputSchema>;
