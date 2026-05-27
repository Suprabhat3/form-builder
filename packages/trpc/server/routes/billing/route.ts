import { TRPCError } from "@trpc/server";
import { z, zodUndefinedModel } from "../../schema";
import { protectedProcedure, publicProcedure, router } from "../../trpc";
import { generatePath } from "../../utils/path-generator";
import { billingService, BillingError } from "@repo/services/billing";
import {
  checkoutOrderOutputSchema,
  createCheckoutOrderInputSchema,
  planCatalogItemSchema,
  usageOutputSchema,
  verifyPaymentInputSchema,
} from "@repo/services/billing/model";

const TAGS = ["Billing"];
const getPath = generatePath("/billing");

function mapBillingError(error: unknown): never {
  if (error instanceof BillingError) {
    const codeMap = {
      NOT_CONFIGURED: "PRECONDITION_FAILED",
      NOT_FOUND: "NOT_FOUND",
      FORBIDDEN: "FORBIDDEN",
      BAD_REQUEST: "BAD_REQUEST",
      UNAUTHORIZED: "UNAUTHORIZED",
    } as const;

    throw new TRPCError({
      code: codeMap[error.code],
      message: error.message,
    });
  }

  throw error;
}

export const billingRouter = router({
  getPlans: publicProcedure
    .meta({ openapi: { method: "GET", path: getPath("/plans"), tags: TAGS } })
    .input(zodUndefinedModel)
    .output(z.array(planCatalogItemSchema))
    .query(() => billingService.getPlanCatalog()),

  getUsage: protectedProcedure
    .meta({ openapi: { method: "GET", path: getPath("/usage"), tags: TAGS } })
    .input(zodUndefinedModel)
    .output(usageOutputSchema)
    .query(async ({ ctx }) => {
      try {
        return await billingService.getUserUsage(ctx.user.id);
      } catch (error) {
        mapBillingError(error);
      }
    }),

  createCheckoutOrder: protectedProcedure
    .meta({ openapi: { method: "POST", path: getPath("/checkout"), tags: TAGS } })
    .input(createCheckoutOrderInputSchema)
    .output(checkoutOrderOutputSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await billingService.createCheckoutOrder(ctx.user.id, input.plan);
      } catch (error) {
        mapBillingError(error);
      }
    }),

  verifyPayment: protectedProcedure
    .meta({ openapi: { method: "POST", path: getPath("/verify"), tags: TAGS } })
    .input(verifyPaymentInputSchema)
    .output(usageOutputSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await billingService.verifyAndActivatePlan({
          userId: ctx.user.id,
          razorpayOrderId: input.razorpayOrderId,
          razorpayPaymentId: input.razorpayPaymentId,
          razorpaySignature: input.razorpaySignature,
        });
      } catch (error) {
        mapBillingError(error);
      }
    }),
});
