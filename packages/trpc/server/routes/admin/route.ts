import { TRPCError } from "@trpc/server";
import { and, count, desc, eq, gte, ne, sql } from "../../../../database";
import {
  adminAuditLogsTable,
  formsTable,
  formResponsesTable,
  paymentOrdersTable,
  usersTable,
} from "../../../../database/schema";
import { getEffectivePlan, getMaxFormsForPlan, PLAN_PRICES_INR } from "@repo/services/billing/plans";
import { subscriptionPlanSchema } from "@repo/services/billing/model";
import { adminFeatureTemplateInputSchema, adminModerateFormInputSchema } from "@repo/services/forms/model";
import { z, zodUndefinedModel } from "../../schema";
import { adminProcedure, router } from "../../trpc";
import { generatePath } from "../../utils/path-generator";
import { db } from "../../../../database";

const TAGS = ["Admin"];
const getPath = generatePath("/admin");

const adminSubscriberSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  plan: subscriptionPlanSchema,
  effectivePlan: subscriptionPlanSchema,
  planExpiresAt: z.date().nullable(),
  isActive: z.boolean(),
  maxForms: z.number().int().positive(),
  formCount: z.number().int().nonnegative(),
  totalPaidInr: z.number().int().nonnegative(),
  lastPaidAt: z.date().nullable(),
  joinedAt: z.date(),
});

const adminPaymentSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  userName: z.string(),
  userEmail: z.string().email(),
  plan: subscriptionPlanSchema,
  amountInr: z.number().int().nonnegative(),
  currency: z.string(),
  status: z.string(),
  razorpayOrderId: z.string(),
  razorpayPaymentId: z.string().nullable(),
  paidAt: z.date().nullable(),
  createdAt: z.date(),
});

export const adminRouter = router({
  getOverview: adminProcedure
    .meta({ openapi: { method: "GET", path: getPath("/overview"), tags: TAGS } })
    .input(zodUndefinedModel)
    .output(
      z.object({
        totals: z.object({
          users: z.number().int().nonnegative(),
          forms: z.number().int().nonnegative(),
          publishedForms: z.number().int().nonnegative(),
          submissions30d: z.number().int().nonnegative(),
        }),
      }),
    )
    .query(async () => {
      const [users, forms, published, submissions30d] = await Promise.all([
        db.select({ total: count(usersTable.id) }).from(usersTable),
        db.select({ total: count(formsTable.id) }).from(formsTable),
        db.select({ total: count(formsTable.id) }).from(formsTable).where(eq(formsTable.status, "PUBLISHED")),
        db
          .select({ total: count(formResponsesTable.id) })
          .from(formResponsesTable)
          .where(gte(formResponsesTable.submittedAt, new Date(Date.now() - 30 * 24 * 3600 * 1000))),
      ]);
      return {
        totals: {
          users: Number(users[0]?.total ?? 0),
          forms: Number(forms[0]?.total ?? 0),
          publishedForms: Number(published[0]?.total ?? 0),
          submissions30d: Number(submissions30d[0]?.total ?? 0),
        },
      };
    }),

  getActivity: adminProcedure
    .meta({ openapi: { method: "GET", path: getPath("/activity"), tags: TAGS } })
    .input(zodUndefinedModel)
    .output(
      z.array(
        z.object({
          id: z.string().uuid(),
          action: z.string(),
          createdAt: z.date(),
          actor: z.object({
            id: z.string().uuid(),
            name: z.string(),
            email: z.string(),
          }),
          form: z
            .object({
              id: z.string().uuid(),
              title: z.string(),
            })
            .nullable(),
        }),
      ),
    )
    .query(async () => {
      const rows = await db
        .select({
          id: adminAuditLogsTable.id,
          action: adminAuditLogsTable.action,
          createdAt: adminAuditLogsTable.createdAt,
          actorId: usersTable.id,
          actorName: usersTable.name,
          actorEmail: usersTable.email,
          formId: formsTable.id,
          formTitle: formsTable.title,
        })
        .from(adminAuditLogsTable)
        .innerJoin(usersTable, eq(usersTable.id, adminAuditLogsTable.actorUserId))
        .leftJoin(formsTable, eq(formsTable.id, adminAuditLogsTable.targetFormId))
        .orderBy(desc(adminAuditLogsTable.createdAt))
        .limit(50);

      return rows.map((row) => ({
        id: row.id,
        action: row.action,
        createdAt: row.createdAt,
        actor: {
          id: row.actorId,
          name: row.actorName,
          email: row.actorEmail,
        },
        form: row.formId ? { id: row.formId, title: row.formTitle ?? "Untitled" } : null,
      }));
    }),

  listForms: adminProcedure
    .meta({ openapi: { method: "GET", path: getPath("/forms"), tags: TAGS } })
    .input(zodUndefinedModel)
    .output(
      z.array(
        z.object({
          id: z.string().uuid(),
          title: z.string(),
          status: z.string(),
          isTemplate: z.boolean(),
          isFeatured: z.boolean(),
          updatedAt: z.date(),
        }),
      ),
    )
    .query(async () => {
      const rows = await db
        .select({
          id: formsTable.id,
          title: formsTable.title,
          status: formsTable.status,
          isTemplate: formsTable.isTemplate,
          isFeatured: formsTable.isFeatured,
          updatedAt: formsTable.updatedAt,
        })
        .from(formsTable)
        .orderBy(desc(formsTable.updatedAt))
        .limit(200);
      return rows;
    }),

  moderateForm: adminProcedure
    .meta({ openapi: { method: "POST", path: getPath("/forms/moderate"), tags: TAGS } })
    .input(adminModerateFormInputSchema)
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      const existing = await db.select({ id: formsTable.id }).from(formsTable).where(eq(formsTable.id, input.formId)).limit(1);
      if (!existing[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Form not found" });

      const now = new Date();
      if (input.action === "ARCHIVE") {
        await db.update(formsTable).set({ status: "ARCHIVED", archivedAt: now, updatedAt: now }).where(eq(formsTable.id, input.formId));
      } else if (input.action === "UNPUBLISH") {
        await db.update(formsTable).set({ status: "UNPUBLISHED", updatedAt: now }).where(eq(formsTable.id, input.formId));
      } else {
        await db
          .update(formsTable)
          .set({ status: "PUBLISHED", publishedAt: now, archivedAt: null, updatedAt: now })
          .where(eq(formsTable.id, input.formId));
      }
      await db.insert(adminAuditLogsTable).values({
        actorUserId: ctx.user.id,
        targetFormId: input.formId,
        action: `FORM_${input.action}`,
        metadata: {},
      });
      return { success: true };
    }),

  featureTemplate: adminProcedure
    .meta({ openapi: { method: "POST", path: getPath("/templates/feature"), tags: TAGS } })
    .input(adminFeatureTemplateInputSchema)
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      const form = await db
        .select({ id: formsTable.id, isTemplate: formsTable.isTemplate })
        .from(formsTable)
        .where(eq(formsTable.id, input.formId))
        .limit(1);
      if (!form[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Form not found" });
      if (!form[0].isTemplate) throw new TRPCError({ code: "BAD_REQUEST", message: "Only template forms can be featured" });
      await db.update(formsTable).set({ isFeatured: input.isFeatured, updatedAt: new Date() }).where(eq(formsTable.id, input.formId));
      await db.insert(adminAuditLogsTable).values({
        actorUserId: ctx.user.id,
        targetFormId: input.formId,
        action: input.isFeatured ? "TEMPLATE_FEATURED" : "TEMPLATE_UNFEATURED",
        metadata: {},
      });
      return { success: true };
    }),

  getSubscriptionOverview: adminProcedure
    .meta({ openapi: { method: "GET", path: getPath("/subscriptions/overview"), tags: TAGS } })
    .input(zodUndefinedModel)
    .output(
      z.object({
        activeSubscribers: z.number().int().nonnegative(),
        expiredSubscribers: z.number().int().nonnegative(),
        freeUsers: z.number().int().nonnegative(),
        byPlan: z.object({
          STARTER: z.number().int().nonnegative(),
          PRO: z.number().int().nonnegative(),
          BUSINESS: z.number().int().nonnegative(),
        }),
        revenue30dInr: z.number().int().nonnegative(),
        totalRevenueInr: z.number().int().nonnegative(),
        payments30d: z.number().int().nonnegative(),
        totalPayments: z.number().int().nonnegative(),
        mrrEstimateInr: z.number().int().nonnegative(),
      }),
    )
    .query(async () => {
      const now = new Date();
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000);

      const userRows = await db
        .select({
          plan: usersTable.plan,
          planExpiresAt: usersTable.planExpiresAt,
        })
        .from(usersTable);

      let activeSubscribers = 0;
      let expiredSubscribers = 0;
      let freeUsers = 0;
      const byPlan = { STARTER: 0, PRO: 0, BUSINESS: 0 };

      for (const user of userRows) {
        const effectivePlan = getEffectivePlan(user.plan, user.planExpiresAt);
        if (effectivePlan === "FREE") {
          if (user.plan !== "FREE" && user.planExpiresAt) {
            expiredSubscribers += 1;
          } else {
            freeUsers += 1;
          }
          continue;
        }

        activeSubscribers += 1;
        byPlan[effectivePlan] += 1;
      }

      const [payments30dRow, totalPaymentsRow, revenue30dRow, totalRevenueRow] = await Promise.all([
        db
          .select({ total: count(paymentOrdersTable.id) })
          .from(paymentOrdersTable)
          .where(and(eq(paymentOrdersTable.status, "paid"), gte(paymentOrdersTable.paidAt, thirtyDaysAgo))),
        db
          .select({ total: count(paymentOrdersTable.id) })
          .from(paymentOrdersTable)
          .where(eq(paymentOrdersTable.status, "paid")),
        db
          .select({ total: sql<number>`coalesce(sum(${paymentOrdersTable.amount}), 0)` })
          .from(paymentOrdersTable)
          .where(and(eq(paymentOrdersTable.status, "paid"), gte(paymentOrdersTable.paidAt, thirtyDaysAgo))),
        db
          .select({ total: sql<number>`coalesce(sum(${paymentOrdersTable.amount}), 0)` })
          .from(paymentOrdersTable)
          .where(eq(paymentOrdersTable.status, "paid")),
      ]);

      const mrrEstimateInr =
        byPlan.STARTER * PLAN_PRICES_INR.STARTER +
        byPlan.PRO * PLAN_PRICES_INR.PRO +
        byPlan.BUSINESS * PLAN_PRICES_INR.BUSINESS;

      return {
        activeSubscribers,
        expiredSubscribers,
        freeUsers,
        byPlan,
        revenue30dInr: Math.round(Number(revenue30dRow[0]?.total ?? 0) / 100),
        totalRevenueInr: Math.round(Number(totalRevenueRow[0]?.total ?? 0) / 100),
        payments30d: Number(payments30dRow[0]?.total ?? 0),
        totalPayments: Number(totalPaymentsRow[0]?.total ?? 0),
        mrrEstimateInr,
      };
    }),

  listSubscribers: adminProcedure
    .meta({ openapi: { method: "GET", path: getPath("/subscriptions/users"), tags: TAGS } })
    .input(zodUndefinedModel)
    .output(z.array(adminSubscriberSchema))
    .query(async () => {
      const [userRows, formCountRows, paymentSummaryRows] = await Promise.all([
        db
          .select({
            id: usersTable.id,
            name: usersTable.name,
            email: usersTable.email,
            plan: usersTable.plan,
            planExpiresAt: usersTable.planExpiresAt,
            createdAt: usersTable.createdAt,
          })
          .from(usersTable)
          .where(ne(usersTable.plan, "FREE"))
          .orderBy(desc(usersTable.planExpiresAt))
          .limit(200),
        db
          .select({ ownerId: formsTable.ownerId, total: count(formsTable.id) })
          .from(formsTable)
          .groupBy(formsTable.ownerId),
        db
          .select({
            userId: paymentOrdersTable.userId,
            totalPaid: sql<number>`coalesce(sum(case when ${paymentOrdersTable.status} = 'paid' then ${paymentOrdersTable.amount} else 0 end), 0)`,
            lastPaidAt: sql<Date | null>`max(case when ${paymentOrdersTable.status} = 'paid' then ${paymentOrdersTable.paidAt} else null end)`,
          })
          .from(paymentOrdersTable)
          .groupBy(paymentOrdersTable.userId),
      ]);

      const formCountByUser = new Map(formCountRows.map((row) => [row.ownerId, Number(row.total ?? 0)]));
      const paymentByUser = new Map(
        paymentSummaryRows.map((row) => [
          row.userId,
          {
            totalPaidInr: Math.round(Number(row.totalPaid ?? 0) / 100),
            lastPaidAt: row.lastPaidAt ? new Date(row.lastPaidAt) : null,
          },
        ]),
      );

      return userRows.map((user) => {
        const effectivePlan = getEffectivePlan(user.plan, user.planExpiresAt);
        const isActive = effectivePlan !== "FREE";
        const payment = paymentByUser.get(user.id);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          plan: user.plan,
          effectivePlan,
          planExpiresAt: user.planExpiresAt,
          isActive,
          maxForms: getMaxFormsForPlan(user.plan, user.planExpiresAt),
          formCount: formCountByUser.get(user.id) ?? 0,
          totalPaidInr: payment?.totalPaidInr ?? 0,
          lastPaidAt: payment?.lastPaidAt ?? null,
          joinedAt: user.createdAt,
        };
      });
    }),

  listPayments: adminProcedure
    .meta({ openapi: { method: "GET", path: getPath("/subscriptions/payments"), tags: TAGS } })
    .input(zodUndefinedModel)
    .output(z.array(adminPaymentSchema))
    .query(async () => {
      const rows = await db
        .select({
          id: paymentOrdersTable.id,
          userId: paymentOrdersTable.userId,
          userName: usersTable.name,
          userEmail: usersTable.email,
          plan: paymentOrdersTable.plan,
          amount: paymentOrdersTable.amount,
          currency: paymentOrdersTable.currency,
          status: paymentOrdersTable.status,
          razorpayOrderId: paymentOrdersTable.razorpayOrderId,
          razorpayPaymentId: paymentOrdersTable.razorpayPaymentId,
          paidAt: paymentOrdersTable.paidAt,
          createdAt: paymentOrdersTable.createdAt,
        })
        .from(paymentOrdersTable)
        .innerJoin(usersTable, eq(usersTable.id, paymentOrdersTable.userId))
        .orderBy(desc(paymentOrdersTable.createdAt))
        .limit(100);

      return rows.map((row) => ({
        id: row.id,
        userId: row.userId,
        userName: row.userName,
        userEmail: row.userEmail,
        plan: row.plan,
        amountInr: Math.round(row.amount / 100),
        currency: row.currency,
        status: row.status,
        razorpayOrderId: row.razorpayOrderId,
        razorpayPaymentId: row.razorpayPaymentId,
        paidAt: row.paidAt,
        createdAt: row.createdAt,
      }));
    }),
});

