"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckIcon, SparklesIcon, ZapIcon } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "~/trpc/client";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { getAuthUser, getAccessToken, getRefreshToken, setAuthSession } from "~/lib/auth-session";
import { openRazorpayCheckout } from "~/lib/razorpay";

type PlanId = "FREE" | "STARTER" | "PRO" | "BUSINESS";
type PaidSubscriptionPlan = Exclude<PlanId, "FREE">;

const PLAN_ICONS: Record<PlanId, typeof SparklesIcon> = {
  FREE: SparklesIcon,
  STARTER: ZapIcon,
  PRO: SparklesIcon,
  BUSINESS: SparklesIcon,
};

export function PricingCards({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<PaidSubscriptionPlan | null>(null);

  const { data: plans } = trpc.billing.getPlans.useQuery();
  const { data: usage, refetch: refetchUsage } = trpc.billing.getUsage.useQuery(undefined, {
    retry: false,
    enabled: !!getAuthUser(),
  });
  const createOrder = trpc.billing.createCheckoutOrder.useMutation();
  const verifyPayment = trpc.billing.verifyPayment.useMutation();
  const utils = trpc.useUtils();

  const handleUpgrade = async (planId: PlanId) => {
    if (planId === "FREE") {
      router.push("/signup");
      return;
    }

    const authUser = getAuthUser();
    if (!authUser) {
      router.push(`/login?next=${encodeURIComponent("/pricing")}`);
      return;
    }

    const paidPlan = planId as PaidSubscriptionPlan;
    setLoadingPlan(paidPlan);

    try {
      const order = await createOrder.mutateAsync({ plan: paidPlan });
      await openRazorpayCheckout({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        orderId: order.orderId,
        name: "ZenForm",
        description: `${plans?.find((p) => p.id === paidPlan)?.name ?? paidPlan} plan — monthly`,
        prefill: {
          name: authUser.name,
          email: authUser.email,
        },
        onSuccess: async (response) => {
          try {
            await verifyPayment.mutateAsync({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            const me = await utils.auth.me.fetch();
            const accessToken = getAccessToken();
            const refreshToken = getRefreshToken();
            if (me && accessToken && refreshToken) {
              setAuthSession({ accessToken, refreshToken, user: me });
            }
            await refetchUsage();
            toast.success("Plan upgraded successfully! You can create more forms now.");
          } catch {
            toast.error("Payment received but verification failed. Contact support if your plan is not active.");
          }
        },
        onDismiss: () => {
          toast.message("Checkout closed. You can upgrade anytime.");
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to start checkout";
      toast.error(message);
    } finally {
      setLoadingPlan(null);
    }
  };

  const currentPlan = usage?.plan ?? getAuthUser()?.plan ?? "FREE";

  return (
    <div
      className={[
        "grid gap-5",
        compact ? "md:grid-cols-2 xl:grid-cols-4" : "md:grid-cols-2 xl:grid-cols-4",
      ].join(" ")}
    >
      {(plans ?? []).map((plan) => {
        const Icon = PLAN_ICONS[plan.id as PlanId];
        const isCurrent = currentPlan === plan.id;
        const isPaid = plan.id !== "FREE";
        const isPopular = plan.popular;
        const isLoading = loadingPlan === plan.id;

        return (
          <div
            key={plan.id}
            className={[
              "relative flex flex-col rounded-[28px] border p-6 transition-all duration-300",
              isPopular
                ? "border-primary/50 bg-gradient-to-b from-primary/8 via-surface-container-lowest to-surface-container-lowest shadow-[0_20px_60px_-20px_rgba(0,0,0,0.25)] scale-[1.02] z-10"
                : "border-outline-variant/30 bg-surface-container-lowest/80 hover:border-primary/25 hover:shadow-lg",
            ].join(" ")}
          >
            {isPopular ? (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-on-primary px-3 py-1 shadow-md">
                Most Popular
              </Badge>
            ) : null}

            <div className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/15">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-lg font-bold text-on-surface">{plan.name}</h3>
                  <p className="text-xs text-on-surface-variant">{plan.description}</p>
                </div>
              </div>

              <div className="flex items-end gap-1 mt-4">
                {plan.priceInr === 0 ? (
                  <span className="text-4xl font-black tracking-tight text-on-surface">Free</span>
                ) : (
                  <>
                    <span className="text-sm font-semibold text-on-surface-variant mb-1">₹</span>
                    <span className="text-4xl font-black tracking-tight text-on-surface">{plan.priceInr}</span>
                    <span className="text-sm text-on-surface-variant mb-1">/month</span>
                  </>
                )}
              </div>

              <p className="mt-2 text-sm font-medium text-primary">
                Up to {plan.maxForms} forms
              </p>
            </div>

            <ul className="space-y-2.5 mb-6 flex-1">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-on-surface-variant">
                  <CheckIcon className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            {isCurrent ? (
              <Button variant="outline" disabled className="w-full rounded-xl h-11 font-semibold">
                Current Plan
              </Button>
            ) : plan.id === "FREE" ? (
              <Button
                asChild
                variant="outline"
                className="w-full rounded-xl h-11 font-semibold border-outline-variant/40"
              >
                <Link href="/signup">Get Started Free</Link>
              </Button>
            ) : (
              <Button
                className="w-full rounded-xl h-11 font-semibold shadow-md"
                disabled={isLoading}
                onClick={() => handleUpgrade(plan.id as PlanId)}
              >
                {isLoading ? "Opening checkout..." : isPaid ? `Upgrade to ${plan.name}` : "Choose Plan"}
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
