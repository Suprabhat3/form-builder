import type { SubscriptionPlan } from "./model";

export const PLAN_CATALOG = [
  {
    id: "FREE" as const,
    name: "Free",
    priceInr: 0,
    maxForms: 5,
    description: "Perfect for trying ZenForm and small side projects.",
    features: [
      "Up to 5 forms",
      "Unlimited responses",
      "All 8 premium themes",
      "Public form sharing",
      "Basic analytics",
    ],
  },
  {
    id: "STARTER" as const,
    name: "Starter",
    priceInr: 99,
    maxForms: 10,
    description: "Unlock more forms for growing creators and freelancers.",
    features: [
      "Up to 10 forms",
      "Everything in Free",
      "Email notifications",
      "Response exports",
      "Priority support",
    ],
  },
  {
    id: "PRO" as const,
    name: "Pro",
    priceInr: 299,
    maxForms: 20,
    description: "Built for teams shipping multiple campaigns at once.",
    features: [
      "Up to 20 forms",
      "Everything in Starter",
      "Advanced analytics",
      "Custom thank-you pages",
      "Template cloning",
    ],
    popular: true,
  },
  {
    id: "BUSINESS" as const,
    name: "Business",
    priceInr: 499,
    maxForms: 50,
    description: "Scale form operations across departments and clients.",
    features: [
      "Up to 50 forms",
      "Everything in Pro",
      "Password-protected forms",
      "Admin moderation tools",
      "Dedicated onboarding",
    ],
  },
] as const;

export const PLAN_LIMITS: Record<SubscriptionPlan, number> = {
  FREE: 5,
  STARTER: 10,
  PRO: 20,
  BUSINESS: 50,
};

export const PLAN_PRICES_INR: Record<Exclude<SubscriptionPlan, "FREE">, number> = {
  STARTER: 99,
  PRO: 299,
  BUSINESS: 499,
};

export const PLAN_DURATION_DAYS = 30;

export function getEffectivePlan(
  plan: SubscriptionPlan,
  planExpiresAt: Date | null | undefined,
): SubscriptionPlan {
  if (plan === "FREE") return "FREE";
  if (!planExpiresAt || planExpiresAt.getTime() <= Date.now()) return "FREE";
  return plan;
}

export function getMaxFormsForPlan(plan: SubscriptionPlan, planExpiresAt?: Date | null): number {
  return PLAN_LIMITS[getEffectivePlan(plan, planExpiresAt ?? null)];
}

export function getPlanCatalogItem(plan: SubscriptionPlan) {
  return PLAN_CATALOG.find((item) => item.id === plan)!;
}

export function amountInPaise(priceInr: number): number {
  return priceInr * 100;
}
