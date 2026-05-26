import { TRPCError } from "@trpc/server";
import { and, count, desc, eq, gte } from "../../../../database";
import { adminAuditLogsTable, formsTable, formResponsesTable, usersTable } from "../../../../database/schema";
import { adminFeatureTemplateInputSchema, adminModerateFormInputSchema } from "@repo/services/forms/model";
import { z, zodUndefinedModel } from "../../schema";
import { adminProcedure, router } from "../../trpc";
import { generatePath } from "../../utils/path-generator";
import { db } from "../../../../database";

const TAGS = ["Admin"];
const getPath = generatePath("/admin");

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
});

