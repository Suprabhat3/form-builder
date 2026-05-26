import { TRPCError } from "@trpc/server";
import { createHash } from "crypto";
import { and, asc, count, desc, eq, gte, ilike, inArray, lte, or, sql } from "../../../../database";
import {
  formFieldsTable,
  formPublicSettingsTable,
  formResponsesTable,
  formResponseItemsTable,
  analyticsEventsTable,
  emailLogsTable,
  formsTable,
  usersTable,
  fieldTypeEnum,
  formStatusEnum,
  formVisibilityEnum,
  adminAuditLogsTable,
} from "../../../../database/schema";
import {
  addFormFieldInputSchema,
  analyticsEventTypeSchema,
  createFormInputSchema,
  creatorDigestIntervalHoursSchema,
  creatorNotificationModeSchema,
  formFieldIdInputSchema,
  formIdInputSchema,
  formStatusSchema,
  formThemeCatalog,
  formThemeKeySchema,
  formVisibilitySchema,
  getAnalyticsOverviewInputSchema,
  getBySlugInputSchema,
  getResponseDetailInputSchema,
  getResponsesInputSchema,
  exportResponsesCsvInputSchema,
  recordAnalyticsEventInputSchema,
  reorderFormFieldsInputSchema,
  submitResponseInputSchema,
  cloneTemplateInputSchema,
  markAsTemplateInputSchema,
  adminFeatureTemplateInputSchema,
  adminModerateFormInputSchema,
  updateFormFieldInputSchema,
  updateFormInputSchema,
} from "@repo/services/forms/model";
import { z, zodUndefinedModel } from "../../schema";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "../../trpc";
import { db } from "../../../../database";
import { resendClient } from "@repo/services/clients/resend";
import { env } from "@repo/services/env";
import { generatePath } from "../../utils/path-generator";

function slugify(input: string): string {
  const cleaned = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return cleaned || "untitled-form";
}

async function getOwnedFormOrThrow(formId: string, ownerId: string) {
  const form = await db
    .select({
      id: formsTable.id,
      ownerId: formsTable.ownerId,
      status: formsTable.status,
    })
    .from(formsTable)
    .where(and(eq(formsTable.id, formId), eq(formsTable.ownerId, ownerId)))
    .limit(1);

  if (!form[0]) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Form not found" });
  }

  return form[0];
}

async function generateUniqueSlug(title: string): Promise<string> {
  const base = slugify(title);
  let candidate = base;
  let n = 1;

  while (true) {
    const existing = await db
      .select({ id: formsTable.id })
      .from(formsTable)
      .where(eq(formsTable.slug, candidate))
      .limit(1);

    if (!existing[0]) return candidate;
    n += 1;
    candidate = `${base}-${n}`;
  }
}

function fieldKeyFromType(type: (typeof fieldTypeEnum.enumValues)[number], idx: number): string {
  const prefix = type.toLowerCase();
  return `${prefix}_${idx}`;
}

const TAGS = ["Forms"];
const getPath = generatePath("/forms");

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildImmediateNotificationHtml(params: {
  formTitle: string;
  responseLink: string;
  respondentName: string;
  respondentEmail: string;
  submittedAt: Date;
}): string {
  return `
<div style="font-family:Arial,sans-serif;background:#f8fafc;padding:24px;color:#0f172a;">
  <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:24px;">
    <div style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#64748b;">Form Builder</div>
    <h1 style="margin:8px 0 12px;font-size:22px;line-height:1.3;">New response received</h1>
    <p style="margin:0 0 16px;color:#334155;">Your form <strong>${escapeHtml(params.formTitle)}</strong> just got a new submission.</p>
    <div style="background:#f1f5f9;border-radius:12px;padding:12px 14px;margin-bottom:16px;">
      <div style="font-size:13px;color:#334155;"><strong>Respondent:</strong> ${escapeHtml(params.respondentName)}</div>
      <div style="font-size:13px;color:#334155;"><strong>Email:</strong> ${escapeHtml(params.respondentEmail)}</div>
      <div style="font-size:13px;color:#334155;"><strong>Submitted:</strong> ${escapeHtml(params.submittedAt.toISOString())}</div>
    </div>
    <a href="${params.responseLink}" style="display:inline-block;padding:10px 16px;background:#0f172a;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600;">
      View responses
    </a>
  </div>
</div>`;
}

function buildDigestNotificationHtml(params: {
  formTitle: string;
  count: number;
  intervalHours: number;
  responseLink: string;
}): string {
  return `
<div style="font-family:Arial,sans-serif;background:#f8fafc;padding:24px;color:#0f172a;">
  <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:24px;">
    <div style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#64748b;">Form Builder Digest</div>
    <h1 style="margin:8px 0 12px;font-size:22px;line-height:1.3;">${params.count} new responses in the last ${params.intervalHours} hour(s)</h1>
    <p style="margin:0 0 16px;color:#334155;">Your form <strong>${escapeHtml(params.formTitle)}</strong> is getting activity.</p>
    <a href="${params.responseLink}" style="display:inline-block;padding:10px 16px;background:#0f172a;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600;">
      Open responses dashboard
    </a>
  </div>
</div>`;
}

function formatAnswerValue(value: unknown): string {
  if (value === null || value === undefined) return "Not answered";
  if (Array.isArray(value)) return value.length > 0 ? value.map(v => String(v)).join(", ") : "Not answered";
  if (typeof value === "object") return JSON.stringify(value);
  const text = String(value).trim();
  return text.length > 0 ? text : "Not answered";
}

function buildRespondentReceiptHtml(params: {
  formTitle: string;
  respondentName: string;
  submittedAt: Date;
  answers: Array<{ label: string; value: unknown }>;
}): string {
  const rows = params.answers
    .map((item) => {
      return `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;vertical-align:top;font-weight:600;color:#0f172a;">${escapeHtml(item.label)}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;color:#334155;">${escapeHtml(formatAnswerValue(item.value))}</td>
        </tr>`;
    })
    .join("");

  return `
<div style="font-family:Arial,sans-serif;background:#f8fafc;padding:24px;color:#0f172a;">
  <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:24px;">
    <div style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#64748b;">Form Builder</div>
    <h1 style="margin:8px 0 12px;font-size:22px;line-height:1.3;">Your response has been recorded</h1>
    <p style="margin:0 0 8px;color:#334155;">Hi ${escapeHtml(params.respondentName)}, here is a copy of your submission for <strong>${escapeHtml(params.formTitle)}</strong>.</p>
    <p style="margin:0 0 16px;color:#64748b;font-size:13px;">Submitted at: ${escapeHtml(params.submittedAt.toISOString())}</p>
    <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
      <thead>
        <tr style="background:#f1f5f9;">
          <th style="text-align:left;padding:10px 12px;border-bottom:1px solid #e2e8f0;">Question</th>
          <th style="text-align:left;padding:10px 12px;border-bottom:1px solid #e2e8f0;">Answer</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  </div>
</div>`;
}

function hashSubmitterIp(ip: string): string {
  const salt = env.RATE_LIMIT_SALT ?? env.JWT_ACCESS_SECRET;
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

function hashFormPassword(password: string): string {
  const salt = env.RATE_LIMIT_SALT ?? env.JWT_ACCESS_SECRET;
  return createHash("sha256").update(`form-password:${salt}:${password}`).digest("hex");
}

function protectedCookieName(formId: string): string {
  return `form_unlock_${formId}`;
}

function computeCloseState(params: {
  expiresAt: Date | null;
  maxResponses: number | null;
  responseCount: number;
}): { isClosed: boolean; closeReason: "EXPIRED" | "LIMIT_REACHED" | null } {
  const now = new Date();
  if (params.expiresAt && params.expiresAt.getTime() <= now.getTime()) {
    return { isClosed: true, closeReason: "EXPIRED" };
  }
  if (params.maxResponses !== null && params.responseCount >= params.maxResponses) {
    return { isClosed: true, closeReason: "LIMIT_REACHED" };
  }
  return { isClosed: false, closeReason: null };
}

function isValueEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

type VisibilityPredicate = { fieldId: string; operator: string; value?: unknown };

function evaluatePredicate(answerValue: unknown, predicate: VisibilityPredicate): boolean {
  switch (predicate.operator) {
    case "equals":
      return String(answerValue ?? "") === String(predicate.value ?? "");
    case "not_equals":
      return String(answerValue ?? "") !== String(predicate.value ?? "");
    case "contains": {
      if (Array.isArray(answerValue)) return answerValue.map(v => String(v)).includes(String(predicate.value ?? ""));
      return String(answerValue ?? "").includes(String(predicate.value ?? ""));
    }
    case "not_contains": {
      if (Array.isArray(answerValue)) return !answerValue.map(v => String(v)).includes(String(predicate.value ?? ""));
      return !String(answerValue ?? "").includes(String(predicate.value ?? ""));
    }
    case "is_empty":
      return isValueEmpty(answerValue);
    case "is_not_empty":
      return !isValueEmpty(answerValue);
    default:
      return true;
  }
}

function isFieldVisible(
  field: { config: Record<string, unknown> | null },
  answersByFieldId: Map<string, unknown>,
): boolean {
  const rules = (field.config as { visibilityRules?: { all?: VisibilityPredicate[] } } | null)?.visibilityRules;
  const all = rules?.all;
  if (!all || all.length === 0) return true;
  return all.every((predicate) => evaluatePredicate(answersByFieldId.get(predicate.fieldId), predicate));
}

function toCsvCell(value: unknown): string {
  let out: string;
  if (value === null || value === undefined) out = "";
  else if (Array.isArray(value)) out = value.map(v => String(v)).join(", ");
  else if (typeof value === "object") out = JSON.stringify(value);
  else out = String(value);
  return `"${out.replace(/"/g, '""')}"`;
}

async function verifyTurnstileToken(params: { token: string; ip?: string | null }): Promise<boolean> {
  if (!env.TURNSTILE_SECRET_KEY) return true;
  const payload = new URLSearchParams({
    secret: env.TURNSTILE_SECRET_KEY,
    response: params.token,
  });
  if (params.ip) payload.set("remoteip", params.ip);

  try {
    const result = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: payload,
    });
    if (!result.ok) return false;
    const data = (await result.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

export const formRouter = router({
  listPublic: publicProcedure
    .meta({ openapi: { method: "GET", path: getPath("/public"), tags: TAGS } })
    .input(zodUndefinedModel)
    .output(
      z.array(
        z.object({
          id: z.string().uuid(),
          title: z.string(),
          description: z.string().nullable(),
          slug: z.string(),
          themeKey: formThemeKeySchema,
          visibility: formVisibilitySchema,
          status: formStatusSchema,
          responseCount: z.number().int().nonnegative(),
          updatedAt: z.date(),
        }),
      ),
    )
    .query(async () => {
      const rows = await db
        .select({
          id: formsTable.id,
          title: formsTable.title,
          description: formsTable.description,
          slug: formsTable.slug,
          themeKey: formsTable.themeKey,
          visibility: formsTable.visibility,
          status: formsTable.status,
          updatedAt: formsTable.updatedAt,
          responseCount: count(formResponsesTable.id),
        })
        .from(formsTable)
        .leftJoin(formResponsesTable, eq(formResponsesTable.formId, formsTable.id))
        .where(
          and(
            eq(formsTable.status, "PUBLISHED"),
            eq(formsTable.visibility, "PUBLIC"),
          ),
        )
        .groupBy(formsTable.id)
        .orderBy(desc(formsTable.updatedAt));

      return rows.map((row: (typeof rows)[number]) => ({
        ...row,
        themeKey: row.themeKey as z.infer<typeof formThemeKeySchema>,
        visibility: row.visibility as z.infer<typeof formVisibilitySchema>,
        status: row.status as z.infer<typeof formStatusSchema>,
        responseCount: Number(row.responseCount ?? 0),
      }));
    }),
  getThemeCatalog: publicProcedure
    .meta({ openapi: { method: "GET", path: getPath("/themes"), tags: TAGS } })
    .input(zodUndefinedModel)
    .output(
      z.array(
        z.object({
          key: formThemeKeySchema,
          label: z.string(),
          category: z.string(),
        }),
      ),
    )
    .query(() => [...formThemeCatalog]),

  create: protectedProcedure
    .meta({ openapi: { method: "POST", path: getPath(""), tags: TAGS } })
    .input(createFormInputSchema)
    .output(
      z.object({
        id: z.string().uuid(),
        slug: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const slug = await generateUniqueSlug(input.title);

      const inserted = await db
        .insert(formsTable)
        .values({
          ownerId: ctx.user.id,
          title: input.title,
          description: input.description ?? null,
          slug,
          visibility: input.visibility as (typeof formVisibilityEnum.enumValues)[number],
          themeKey: input.themeKey,
        })
        .returning({ id: formsTable.id, slug: formsTable.slug });

      await db.insert(formPublicSettingsTable).values({
        formId: inserted[0]!.id,
      });

      return inserted[0]!;
    }),

  listMine: protectedProcedure
    .meta({ openapi: { method: "GET", path: getPath("/mine"), tags: TAGS } })
    .input(zodUndefinedModel)
    .output(
      z.array(
        z.object({
          id: z.string().uuid(),
          title: z.string(),
          slug: z.string(),
          status: formStatusSchema,
          visibility: formVisibilitySchema,
          themeKey: formThemeKeySchema,
          isTemplate: z.boolean(),
          responseCount: z.number().int().nonnegative(),
          updatedAt: z.date(),
        }),
      ),
    )
    .query(async ({ ctx }) => {
      const rows = await db
        .select({
          id: formsTable.id,
          title: formsTable.title,
          slug: formsTable.slug,
          status: formsTable.status,
          visibility: formsTable.visibility,
          themeKey: formsTable.themeKey,
          isTemplate: formsTable.isTemplate,
          updatedAt: formsTable.updatedAt,
          responseCount: count(formResponsesTable.id),
        })
        .from(formsTable)
        .leftJoin(formResponsesTable, eq(formResponsesTable.formId, formsTable.id))
        .where(eq(formsTable.ownerId, ctx.user.id))
        .groupBy(formsTable.id)
        .orderBy(desc(formsTable.updatedAt));

      return rows.map((row: (typeof rows)[number]) => ({
        ...row,
        status: row.status as (typeof formStatusEnum.enumValues)[number],
        visibility: row.visibility as (typeof formVisibilityEnum.enumValues)[number],
        themeKey: row.themeKey as z.infer<typeof formThemeKeySchema>,
        isTemplate: row.isTemplate,
        responseCount: Number(row.responseCount ?? 0),
      }));
    }),

  getById: protectedProcedure
    .meta({ openapi: { method: "GET", path: getPath("/{formId}"), tags: TAGS } })
    .input(formIdInputSchema)
    .output(
      z.object({
        id: z.string().uuid(),
        title: z.string(),
        description: z.string().nullable(),
        slug: z.string(),
        status: formStatusSchema,
        visibility: formVisibilitySchema,
        themeKey: formThemeKeySchema,
        updatedAt: z.date(),
        notificationSettings: z.object({
          creatorNotificationsEnabled: z.boolean(),
          respondentEmailCopyEnabled: z.boolean(),
          collectRespondentEmail: z.boolean(),
          showProgressBar: z.boolean(),
          maxResponses: z.number().int().positive().nullable(),
          expiresAt: z.date().nullable(),
          closeMessage: z.string().nullable(),
          successMessage: z.string().nullable(),
          hasPassword: z.boolean(),
          thankYouTitle: z.string().nullable(),
          thankYouBody: z.string().nullable(),
          thankYouCtaText: z.string().nullable(),
          thankYouCtaUrl: z.string().nullable(),
          creatorNotificationMode: creatorNotificationModeSchema,
          creatorDigestIntervalHours: creatorDigestIntervalHoursSchema,
        }),
        fields: z.array(
          z.object({
            id: z.string().uuid(),
            key: z.string(),
            type: z.string(),
            label: z.string(),
            helperText: z.string().nullable(),
            placeholder: z.string().nullable(),
            required: z.boolean(),
            position: z.number().int(),
            config: z.record(z.string(), z.unknown()),
          }),
        ),
      }),
    )
    .query(async ({ input, ctx }) => {
      const form = await db
        .select({
          id: formsTable.id,
          title: formsTable.title,
          description: formsTable.description,
          slug: formsTable.slug,
          status: formsTable.status,
          visibility: formsTable.visibility,
          themeKey: formsTable.themeKey,
          updatedAt: formsTable.updatedAt,
          creatorNotificationsEnabled: formPublicSettingsTable.creatorNotificationsEnabled,
          respondentEmailCopyEnabled: formPublicSettingsTable.respondentEmailCopyEnabled,
          collectRespondentEmail: formPublicSettingsTable.collectRespondentEmail,
          showProgressBar: formPublicSettingsTable.showProgressBar,
          maxResponses: formPublicSettingsTable.maxResponses,
          expiresAt: formPublicSettingsTable.expiresAt,
          closeMessage: formPublicSettingsTable.closeMessage,
          successMessage: formPublicSettingsTable.successMessage,
          passwordHash: formPublicSettingsTable.passwordHash,
          thankYouTitle: formPublicSettingsTable.thankYouTitle,
          thankYouBody: formPublicSettingsTable.thankYouBody,
          thankYouCtaText: formPublicSettingsTable.thankYouCtaText,
          thankYouCtaUrl: formPublicSettingsTable.thankYouCtaUrl,
          creatorNotificationMode: formPublicSettingsTable.creatorNotificationMode,
          creatorDigestIntervalHours: formPublicSettingsTable.creatorDigestIntervalHours,
        })
        .from(formsTable)
        .leftJoin(formPublicSettingsTable, eq(formPublicSettingsTable.formId, formsTable.id))
        .where(and(eq(formsTable.id, input.formId), eq(formsTable.ownerId, ctx.user.id)))
        .limit(1);

      if (!form[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Form not found" });

      const fields = await db
        .select({
          id: formFieldsTable.id,
          key: formFieldsTable.key,
          type: formFieldsTable.type,
          label: formFieldsTable.label,
          helperText: formFieldsTable.helperText,
          placeholder: formFieldsTable.placeholder,
          required: formFieldsTable.required,
          position: formFieldsTable.position,
          config: formFieldsTable.config,
        })
        .from(formFieldsTable)
        .where(eq(formFieldsTable.formId, input.formId))
        .orderBy(asc(formFieldsTable.position), asc(formFieldsTable.createdAt));

      return {
        ...form[0],
        status: form[0].status as (typeof formStatusEnum.enumValues)[number],
        visibility: form[0].visibility as (typeof formVisibilityEnum.enumValues)[number],
        themeKey: form[0].themeKey as z.infer<typeof formThemeKeySchema>,
        notificationSettings: {
          creatorNotificationsEnabled: Boolean(form[0].creatorNotificationsEnabled ?? false),
          respondentEmailCopyEnabled: Boolean(form[0].respondentEmailCopyEnabled ?? true),
          collectRespondentEmail: Boolean(form[0].collectRespondentEmail ?? false),
          showProgressBar: Boolean(form[0].showProgressBar ?? true),
          maxResponses: form[0].maxResponses ?? null,
          expiresAt: form[0].expiresAt ?? null,
          closeMessage: form[0].closeMessage ?? null,
          successMessage: form[0].successMessage ?? null,
          hasPassword: Boolean(form[0].passwordHash),
          thankYouTitle: form[0].thankYouTitle ?? null,
          thankYouBody: form[0].thankYouBody ?? null,
          thankYouCtaText: form[0].thankYouCtaText ?? null,
          thankYouCtaUrl: form[0].thankYouCtaUrl ?? null,
          creatorNotificationMode:
            (form[0].creatorNotificationMode as z.infer<typeof creatorNotificationModeSchema> | null) ?? "IMMEDIATE",
          creatorDigestIntervalHours:
            (form[0].creatorDigestIntervalHours as z.infer<typeof creatorDigestIntervalHoursSchema> | null) ?? 1,
        },
        fields: fields.map((f: (typeof fields)[number]) => ({
          ...f,
          type: f.type,
          config: (f.config as Record<string, unknown>) ?? {},
        })),
      };
    }),

  update: protectedProcedure
    .meta({ openapi: { method: "PATCH", path: getPath("/{formId}"), tags: TAGS } })
    .input(updateFormInputSchema)
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      await getOwnedFormOrThrow(input.formId, ctx.user.id);

      await db
        .update(formsTable)
        .set({
          ...(input.title !== undefined ? { title: input.title } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
          ...(input.visibility !== undefined
            ? { visibility: input.visibility as (typeof formVisibilityEnum.enumValues)[number] }
            : {}),
          ...(input.themeKey !== undefined ? { themeKey: input.themeKey } : {}),
          updatedAt: new Date(),
        })
        .where(eq(formsTable.id, input.formId));

      const shouldUpdateNotificationSettings =
        input.creatorNotificationsEnabled !== undefined ||
        input.respondentEmailCopyEnabled !== undefined ||
        input.collectRespondentEmail !== undefined ||
        input.showProgressBar !== undefined ||
        input.maxResponses !== undefined ||
        input.expiresAt !== undefined ||
        input.closeMessage !== undefined ||
        input.successMessage !== undefined ||
        input.password !== undefined ||
        input.thankYouTitle !== undefined ||
        input.thankYouBody !== undefined ||
        input.thankYouCtaText !== undefined ||
        input.thankYouCtaUrl !== undefined ||
        input.creatorNotificationMode !== undefined ||
        input.creatorDigestIntervalHours !== undefined;

      if (shouldUpdateNotificationSettings) {
        const passwordHash =
          input.password === undefined
            ? undefined
            : input.password === null
              ? null
              : hashFormPassword(input.password);
        await db
          .insert(formPublicSettingsTable)
          .values({
            formId: input.formId,
            creatorNotificationsEnabled: input.creatorNotificationsEnabled ?? false,
            respondentEmailCopyEnabled: input.respondentEmailCopyEnabled ?? true,
            collectRespondentEmail: input.collectRespondentEmail ?? false,
            showProgressBar: input.showProgressBar ?? true,
            maxResponses: input.maxResponses ?? null,
            expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
            closeMessage: input.closeMessage ?? null,
            successMessage: input.successMessage ?? null,
            passwordHash: passwordHash ?? null,
            thankYouTitle: input.thankYouTitle ?? null,
            thankYouBody: input.thankYouBody ?? null,
            thankYouCtaText: input.thankYouCtaText ?? null,
            thankYouCtaUrl: input.thankYouCtaUrl ?? null,
            creatorNotificationMode: input.creatorNotificationMode ?? "IMMEDIATE",
            creatorDigestIntervalHours: input.creatorDigestIntervalHours ?? 1,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: formPublicSettingsTable.formId,
            set: {
              ...(input.creatorNotificationsEnabled !== undefined
                ? { creatorNotificationsEnabled: input.creatorNotificationsEnabled }
                : {}),
              ...(input.respondentEmailCopyEnabled !== undefined
                ? { respondentEmailCopyEnabled: input.respondentEmailCopyEnabled }
                : {}),
              ...(input.collectRespondentEmail !== undefined
                ? { collectRespondentEmail: input.collectRespondentEmail }
                : {}),
              ...(input.showProgressBar !== undefined
                ? { showProgressBar: input.showProgressBar }
                : {}),
              ...(input.maxResponses !== undefined
                ? { maxResponses: input.maxResponses }
                : {}),
              ...(input.expiresAt !== undefined
                ? { expiresAt: input.expiresAt ? new Date(input.expiresAt) : null }
                : {}),
              ...(input.closeMessage !== undefined
                ? { closeMessage: input.closeMessage }
                : {}),
              ...(input.successMessage !== undefined
                ? { successMessage: input.successMessage }
                : {}),
              ...(passwordHash !== undefined
                ? { passwordHash }
                : {}),
              ...(input.thankYouTitle !== undefined
                ? { thankYouTitle: input.thankYouTitle }
                : {}),
              ...(input.thankYouBody !== undefined
                ? { thankYouBody: input.thankYouBody }
                : {}),
              ...(input.thankYouCtaText !== undefined
                ? { thankYouCtaText: input.thankYouCtaText }
                : {}),
              ...(input.thankYouCtaUrl !== undefined
                ? { thankYouCtaUrl: input.thankYouCtaUrl }
                : {}),
              ...(input.creatorNotificationMode !== undefined
                ? { creatorNotificationMode: input.creatorNotificationMode }
                : {}),
              ...(input.creatorDigestIntervalHours !== undefined
                ? { creatorDigestIntervalHours: input.creatorDigestIntervalHours }
                : {}),
              updatedAt: new Date(),
            },
          });
      }

      return { success: true };
    }),

  publish: protectedProcedure
    .meta({ openapi: { method: "POST", path: getPath("/{formId}/publish"), tags: TAGS } })
    .input(formIdInputSchema)
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      const form = await getOwnedFormOrThrow(input.formId, ctx.user.id);
      if (form.status === "ARCHIVED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Archived forms cannot be published" });
      }

      await db
        .update(formsTable)
        .set({
          status: "PUBLISHED",
          publishedAt: new Date(),
          archivedAt: null,
          updatedAt: new Date(),
        })
        .where(eq(formsTable.id, input.formId));
      return { success: true };
    }),

  unpublish: protectedProcedure
    .meta({ openapi: { method: "POST", path: getPath("/{formId}/unpublish"), tags: TAGS } })
    .input(formIdInputSchema)
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      await getOwnedFormOrThrow(input.formId, ctx.user.id);
      await db
        .update(formsTable)
        .set({
          status: "UNPUBLISHED",
          updatedAt: new Date(),
        })
        .where(eq(formsTable.id, input.formId));
      return { success: true };
    }),

  archive: protectedProcedure
    .meta({ openapi: { method: "POST", path: getPath("/{formId}/archive"), tags: TAGS } })
    .input(formIdInputSchema)
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      await getOwnedFormOrThrow(input.formId, ctx.user.id);
      await db
        .update(formsTable)
        .set({
          status: "ARCHIVED",
          archivedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(formsTable.id, input.formId));
      return { success: true };
    }),

  delete: protectedProcedure
    .meta({ openapi: { method: "DELETE", path: getPath("/{formId}"), tags: TAGS } })
    .input(formIdInputSchema)
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      const form = await getOwnedFormOrThrow(input.formId, ctx.user.id);
      if (form.status !== "ARCHIVED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Archive form before deleting as a safety step",
        });
      }

      await db.delete(formsTable).where(eq(formsTable.id, input.formId));
      return { success: true };
    }),

  addField: protectedProcedure
    .meta({ openapi: { method: "POST", path: getPath("/{formId}/fields"), tags: TAGS } })
    .input(addFormFieldInputSchema)
    .output(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      await getOwnedFormOrThrow(input.formId, ctx.user.id);

      const countRows = await db
        .select({ total: count(formFieldsTable.id) })
        .from(formFieldsTable)
        .where(eq(formFieldsTable.formId, input.formId));
      const nextPosition = Number(countRows[0]?.total ?? 0);

      const key = input.key ?? fieldKeyFromType(input.type, nextPosition + 1);

      const inserted = await db
        .insert(formFieldsTable)
        .values({
          formId: input.formId,
          key,
          type: input.type as (typeof fieldTypeEnum.enumValues)[number],
          label: input.label,
          helperText: input.helperText ?? null,
          placeholder: input.placeholder ?? null,
          required: input.required,
          position: nextPosition,
          config: input.config,
        })
        .returning({ id: formFieldsTable.id });

      await db.update(formsTable).set({ updatedAt: new Date() }).where(eq(formsTable.id, input.formId));

      return inserted[0]!;
    }),

  updateField: protectedProcedure
    .meta({ openapi: { method: "PATCH", path: getPath("/{formId}/fields/{fieldId}"), tags: TAGS } })
    .input(updateFormFieldInputSchema)
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      await getOwnedFormOrThrow(input.formId, ctx.user.id);

      const existingField = await db
        .select({ id: formFieldsTable.id })
        .from(formFieldsTable)
        .where(and(eq(formFieldsTable.id, input.fieldId), eq(formFieldsTable.formId, input.formId)))
        .limit(1);

      if (!existingField[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Field not found" });

      await db
        .update(formFieldsTable)
        .set({
          ...(input.label !== undefined ? { label: input.label } : {}),
          ...(input.helperText !== undefined ? { helperText: input.helperText } : {}),
          ...(input.placeholder !== undefined ? { placeholder: input.placeholder } : {}),
          ...(input.required !== undefined ? { required: input.required } : {}),
          ...(input.config !== undefined ? { config: input.config } : {}),
          updatedAt: new Date(),
        })
        .where(eq(formFieldsTable.id, input.fieldId));

      await db.update(formsTable).set({ updatedAt: new Date() }).where(eq(formsTable.id, input.formId));

      return { success: true };
    }),

  reorderFields: protectedProcedure
    .meta({ openapi: { method: "POST", path: getPath("/{formId}/fields/reorder"), tags: TAGS } })
    .input(reorderFormFieldsInputSchema)
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      await getOwnedFormOrThrow(input.formId, ctx.user.id);

      const existing = await db
        .select({ id: formFieldsTable.id })
        .from(formFieldsTable)
        .where(eq(formFieldsTable.formId, input.formId));

      if (existing.length !== input.fieldIdsInOrder.length) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid field order payload" });
      }

      const existingIds = new Set(existing.map((x: (typeof existing)[number]) => x.id));
      if (input.fieldIdsInOrder.some((id: string) => !existingIds.has(id))) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid field ids in ordering payload" });
      }

      await Promise.all(
        input.fieldIdsInOrder.map((fieldId: string, index: number) =>
          db
            .update(formFieldsTable)
            .set({ position: index, updatedAt: new Date() })
            .where(and(eq(formFieldsTable.id, fieldId), eq(formFieldsTable.formId, input.formId))),
        ),
      );

      await db.update(formsTable).set({ updatedAt: new Date() }).where(eq(formsTable.id, input.formId));
      return { success: true };
    }),

  removeField: protectedProcedure
    .meta({ openapi: { method: "DELETE", path: getPath("/{formId}/fields/{fieldId}"), tags: TAGS } })
    .input(formFieldIdInputSchema)
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      await getOwnedFormOrThrow(input.formId, ctx.user.id);

      const existing = await db
        .select({ id: formFieldsTable.id })
        .from(formFieldsTable)
        .where(and(eq(formFieldsTable.id, input.fieldId), eq(formFieldsTable.formId, input.formId)))
        .limit(1);

      if (!existing[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Field not found" });

      await db.delete(formFieldsTable).where(eq(formFieldsTable.id, input.fieldId));

      const remaining = await db
        .select({ id: formFieldsTable.id })
        .from(formFieldsTable)
        .where(eq(formFieldsTable.formId, input.formId))
        .orderBy(asc(formFieldsTable.position), asc(formFieldsTable.createdAt));

      await Promise.all(
        remaining.map((field: (typeof remaining)[number], idx: number) =>
          db.update(formFieldsTable).set({ position: idx }).where(eq(formFieldsTable.id, field.id)),
        ),
      );

      await db.update(formsTable).set({ updatedAt: new Date() }).where(eq(formsTable.id, input.formId));
      return { success: true };
    }),

  getBySlug: publicProcedure
    .meta({ openapi: { method: "GET", path: getPath("/slug/{slug}"), tags: TAGS } })
    .input(getBySlugInputSchema)
    .output(
      z.object({
        id: z.string().uuid(),
        title: z.string(),
        description: z.string().nullable(),
        status: formStatusSchema,
        visibility: formVisibilitySchema,
        themeKey: formThemeKeySchema,
        isClosed: z.boolean(),
        closeReason: z.enum(["EXPIRED", "LIMIT_REACHED"]).nullable(),
        requiresPassword: z.boolean(),
        unlocked: z.boolean(),
        closeMessage: z.string().nullable(),
        successMessage: z.string().nullable(),
        showProgressBar: z.boolean(),
        collectRespondentEmail: z.boolean(),
        thankYouTitle: z.string().nullable(),
        thankYouBody: z.string().nullable(),
        thankYouCtaText: z.string().nullable(),
        thankYouCtaUrl: z.string().nullable(),
        respondentEmailCopyEnabled: z.boolean(),
        fields: z.array(
          z.object({
            id: z.string().uuid(),
            key: z.string(),
            type: z.string(),
            label: z.string(),
            helperText: z.string().nullable(),
            placeholder: z.string().nullable(),
            required: z.boolean(),
            position: z.number().int(),
            config: z.record(z.string(), z.unknown()),
          }),
        ),
      }),
    )
    .query(async ({ input, ctx }) => {
      const form = await db
        .select({
          id: formsTable.id,
          title: formsTable.title,
          description: formsTable.description,
          slug: formsTable.slug,
          status: formsTable.status,
          visibility: formsTable.visibility,
          themeKey: formsTable.themeKey,
          closeMessage: formPublicSettingsTable.closeMessage,
          successMessage: formPublicSettingsTable.successMessage,
          showProgressBar: formPublicSettingsTable.showProgressBar,
          collectRespondentEmail: formPublicSettingsTable.collectRespondentEmail,
          maxResponses: formPublicSettingsTable.maxResponses,
          expiresAt: formPublicSettingsTable.expiresAt,
          passwordHash: formPublicSettingsTable.passwordHash,
          thankYouTitle: formPublicSettingsTable.thankYouTitle,
          thankYouBody: formPublicSettingsTable.thankYouBody,
          thankYouCtaText: formPublicSettingsTable.thankYouCtaText,
          thankYouCtaUrl: formPublicSettingsTable.thankYouCtaUrl,
          respondentEmailCopyEnabled: formPublicSettingsTable.respondentEmailCopyEnabled,
        })
        .from(formsTable)
        .leftJoin(formPublicSettingsTable, eq(formPublicSettingsTable.formId, formsTable.id))
        .where(eq(formsTable.slug, input.slug))
        .limit(1);

      if (!form[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Form not found" });
      }

      if (form[0].status !== "PUBLISHED") {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "This form is not currently published" });
      }

      const responseCountRows = await db
        .select({ total: count(formResponsesTable.id) })
        .from(formResponsesTable)
        .where(eq(formResponsesTable.formId, form[0].id));
      const responseCount = Number(responseCountRows[0]?.total ?? 0);
      const closeState = computeCloseState({
        expiresAt: form[0].expiresAt,
        maxResponses: form[0].maxResponses,
        responseCount,
      });
      const requiresPassword = Boolean(form[0].passwordHash);
      const unlocked = requiresPassword
        ? ctx.cookies[protectedCookieName(form[0].id)] === "1"
        : true;

      const fields = await db
        .select({
          id: formFieldsTable.id,
          key: formFieldsTable.key,
          type: formFieldsTable.type,
          label: formFieldsTable.label,
          helperText: formFieldsTable.helperText,
          placeholder: formFieldsTable.placeholder,
          required: formFieldsTable.required,
          position: formFieldsTable.position,
          config: formFieldsTable.config,
        })
        .from(formFieldsTable)
        .where(eq(formFieldsTable.formId, form[0].id))
        .orderBy(asc(formFieldsTable.position), asc(formFieldsTable.createdAt));

      return {
        ...form[0],
        status: form[0].status as z.infer<typeof formStatusSchema>,
        visibility: form[0].visibility as z.infer<typeof formVisibilitySchema>,
        themeKey: form[0].themeKey as z.infer<typeof formThemeKeySchema>,
        isClosed: closeState.isClosed,
        closeReason: closeState.closeReason,
        requiresPassword,
        unlocked,
        closeMessage: form[0].closeMessage ?? null,
        successMessage: form[0].successMessage ?? null,
        showProgressBar: Boolean(form[0].showProgressBar ?? true),
        collectRespondentEmail: Boolean(form[0].collectRespondentEmail ?? false),
        thankYouTitle: form[0].thankYouTitle ?? null,
        thankYouBody: form[0].thankYouBody ?? null,
        thankYouCtaText: form[0].thankYouCtaText ?? null,
        thankYouCtaUrl: form[0].thankYouCtaUrl ?? null,
        respondentEmailCopyEnabled: Boolean(form[0].respondentEmailCopyEnabled ?? true),
        fields: fields.map(f => ({
          ...f,
          type: f.type,
          config: (f.config as Record<string, unknown>) ?? {},
        })),
      };
    }),

  recordAnalyticsEvent: publicProcedure
    .meta({ openapi: { method: "POST", path: getPath("/analytics/event"), tags: TAGS } })
    .input(recordAnalyticsEventInputSchema)
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input }) => {
      const form = await db
        .select({
          id: formsTable.id,
          status: formsTable.status,
          closeMessage: formPublicSettingsTable.closeMessage,
          maxResponses: formPublicSettingsTable.maxResponses,
          expiresAt: formPublicSettingsTable.expiresAt,
          passwordHash: formPublicSettingsTable.passwordHash,
          collectRespondentEmail: formPublicSettingsTable.collectRespondentEmail,
        })
        .from(formsTable)
        .leftJoin(formPublicSettingsTable, eq(formPublicSettingsTable.formId, formsTable.id))
        .where(eq(formsTable.id, input.formId))
        .limit(1);

      if (!form[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Form not found" });
      }

      if (form[0].status !== "PUBLISHED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Analytics events require a published form" });
      }

      await db.insert(analyticsEventsTable).values({
        formId: input.formId,
        eventType: input.eventType,
        sessionKey: input.sessionKey ?? null,
        source: input.source ?? null,
        metadata: input.metadata ?? {},
      });

      return { success: true };
    }),

  // Temporary backwards-compatible alias for stale cached clients with a misspelled path.
  recordAnalyticsEven: publicProcedure
    .meta({ openapi: { method: "POST", path: getPath("/analytics/even"), tags: TAGS } })
    .input(recordAnalyticsEventInputSchema)
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input }) => {
      const form = await db
        .select({
          id: formsTable.id,
          status: formsTable.status,
          closeMessage: formPublicSettingsTable.closeMessage,
          maxResponses: formPublicSettingsTable.maxResponses,
          expiresAt: formPublicSettingsTable.expiresAt,
          passwordHash: formPublicSettingsTable.passwordHash,
          collectRespondentEmail: formPublicSettingsTable.collectRespondentEmail,
        })
        .from(formsTable)
        .leftJoin(formPublicSettingsTable, eq(formPublicSettingsTable.formId, formsTable.id))
        .where(eq(formsTable.id, input.formId))
        .limit(1);

      if (!form[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Form not found" });
      }

      if (form[0].status !== "PUBLISHED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Analytics events require a published form" });
      }

      await db.insert(analyticsEventsTable).values({
        formId: input.formId,
        eventType: input.eventType,
        sessionKey: input.sessionKey ?? null,
        source: input.source ?? null,
        metadata: input.metadata ?? {},
      });

      return { success: true };
    }),

  getAnalyticsOverview: protectedProcedure
    .meta({ openapi: { method: "GET", path: getPath("/{formId}/analytics"), tags: TAGS } })
    .input(getAnalyticsOverviewInputSchema)
    .output(
      z.object({
        form: z.object({
          id: z.string().uuid(),
          title: z.string(),
          slug: z.string(),
          status: formStatusSchema,
          visibility: formVisibilitySchema,
          themeKey: formThemeKeySchema,
        }),
        totals: z.object({
          views: z.number().int().nonnegative(),
          starts: z.number().int().nonnegative(),
          submits: z.number().int().nonnegative(),
        }),
        conversion: z.object({
          viewToSubmit: z.number().nonnegative(),
          startToSubmit: z.number().nonnegative(),
        }),
        series: z.array(
          z.object({
            date: z.string(),
            views: z.number().int().nonnegative(),
            starts: z.number().int().nonnegative(),
            submits: z.number().int().nonnegative(),
          }),
        ),
        fields: z.array(
          z.object({
            id: z.string().uuid(),
            label: z.string(),
            type: z.string(),
            required: z.boolean(),
            answeredCount: z.number().int().nonnegative(),
            completionRate: z.number().nonnegative(),
          }),
        ),
        recentResponses: z.array(
          z.object({
            id: z.string().uuid(),
            submittedAt: z.date(),
            respondentEmail: z.string().nullable(),
            respondentName: z.string().nullable(),
            itemCount: z.number().int().nonnegative(),
            answers: z.array(
              z.object({
                fieldId: z.string().uuid(),
                fieldKey: z.string(),
                label: z.string(),
                value: z.unknown(),
              }),
            ),
          }),
        ),
      }),
    )
    .query(async ({ input, ctx }) => {
      await getOwnedFormOrThrow(input.formId, ctx.user.id);

      const form = await db
        .select({
          id: formsTable.id,
          title: formsTable.title,
          slug: formsTable.slug,
          status: formsTable.status,
          visibility: formsTable.visibility,
          themeKey: formsTable.themeKey,
        })
        .from(formsTable)
        .where(eq(formsTable.id, input.formId))
        .limit(1);

      if (!form[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Form not found" });
      }

      const rangeStart = new Date();
      rangeStart.setDate(rangeStart.getDate() - input.rangeDays + 1);
      rangeStart.setHours(0, 0, 0, 0);

      const totalsRows = await db
        .select({
          eventType: analyticsEventsTable.eventType,
          total: count(analyticsEventsTable.id),
        })
        .from(analyticsEventsTable)
        .where(and(eq(analyticsEventsTable.formId, input.formId), gte(analyticsEventsTable.createdAt, rangeStart)))
        .groupBy(analyticsEventsTable.eventType);

      const totalsFromEvents = totalsRows.reduce(
        (acc, row) => {
          const key = row.eventType as "VIEW" | "START" | "SUBMIT";
          if (key === "VIEW") acc.views = Number(row.total ?? 0);
          if (key === "START") acc.starts = Number(row.total ?? 0);
          if (key === "SUBMIT") acc.submits = Number(row.total ?? 0);
          return acc;
        },
        { views: 0, starts: 0, submits: 0 },
      );

      const seriesRows = await db
        .select({
          day: sql<string>`to_char(date_trunc('day', ${analyticsEventsTable.createdAt}), 'YYYY-MM-DD')`.as(
            "day",
          ),
          eventType: analyticsEventsTable.eventType,
          total: count(analyticsEventsTable.id),
        })
        .from(analyticsEventsTable)
        .where(and(eq(analyticsEventsTable.formId, input.formId), gte(analyticsEventsTable.createdAt, rangeStart)))
        .groupBy(sql`date_trunc('day', ${analyticsEventsTable.createdAt})`, analyticsEventsTable.eventType)
        .orderBy(asc(sql`date_trunc('day', ${analyticsEventsTable.createdAt})`));

      const seriesMap = new Map<string, { views: number; starts: number; submits: number }>();
      for (const row of seriesRows) {
        const day = row.day;
        if (!seriesMap.has(day)) {
          seriesMap.set(day, { views: 0, starts: 0, submits: 0 });
        }
        const bucket = seriesMap.get(day)!;
        if (row.eventType === "VIEW") bucket.views = Number(row.total ?? 0);
        if (row.eventType === "START") bucket.starts = Number(row.total ?? 0);
        if (row.eventType === "SUBMIT") bucket.submits = Number(row.total ?? 0);
      }

      const submitSeriesRows = await db
        .select({
          day: sql<string>`to_char(date_trunc('day', ${formResponsesTable.submittedAt}), 'YYYY-MM-DD')`.as(
            "day",
          ),
          total: count(formResponsesTable.id),
        })
        .from(formResponsesTable)
        .where(and(eq(formResponsesTable.formId, input.formId), gte(formResponsesTable.submittedAt, rangeStart)))
        .groupBy(sql`date_trunc('day', ${formResponsesTable.submittedAt})`);

      for (const row of submitSeriesRows) {
        const bucket = seriesMap.get(row.day) ?? { views: 0, starts: 0, submits: 0 };
        bucket.submits = Number(row.total ?? 0);
        seriesMap.set(row.day, bucket);
      }

      const series: { date: string; views: number; starts: number; submits: number }[] = [];
      const cursor = new Date(rangeStart);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      while (cursor <= today) {
        const year = cursor.getFullYear();
        const month = String(cursor.getMonth() + 1).padStart(2, "0");
        const day = String(cursor.getDate()).padStart(2, "0");
        const key = `${year}-${month}-${day}`;
        const bucket = seriesMap.get(key) ?? { views: 0, starts: 0, submits: 0 };
        series.push({ date: key, ...bucket });
        cursor.setDate(cursor.getDate() + 1);
      }

      const responseCountRows = await db
        .select({ total: count(formResponsesTable.id) })
        .from(formResponsesTable)
        .where(eq(formResponsesTable.formId, input.formId));

      const totalResponses = Number(responseCountRows[0]?.total ?? 0);
      const responsesInRangeRows = await db
        .select({ total: count(formResponsesTable.id) })
        .from(formResponsesTable)
        .where(and(eq(formResponsesTable.formId, input.formId), gte(formResponsesTable.submittedAt, rangeStart)));
      const submitsInRange = Number(responsesInRangeRows[0]?.total ?? 0);

      const fields = await db
        .select({
          id: formFieldsTable.id,
          label: formFieldsTable.label,
          type: formFieldsTable.type,
          required: formFieldsTable.required,
        })
        .from(formFieldsTable)
        .where(eq(formFieldsTable.formId, input.formId))
        .orderBy(asc(formFieldsTable.position), asc(formFieldsTable.createdAt));

      const fieldCounts = await db
        .select({
          fieldId: formResponseItemsTable.fieldId,
          answeredCount: sql<number>`count(*) filter (where ${formResponseItemsTable.value} is not null)`.as(
            "answered_count",
          ),
        })
        .from(formResponseItemsTable)
        .innerJoin(formFieldsTable, eq(formResponseItemsTable.fieldId, formFieldsTable.id))
        .where(eq(formFieldsTable.formId, input.formId))
        .groupBy(formResponseItemsTable.fieldId);

      const fieldCountMap = new Map(
        fieldCounts.map((row) => [row.fieldId, Number(row.answeredCount ?? 0)]),
      );

      const fieldsWithMetrics = fields.map((field) => {
        const answeredCount = fieldCountMap.get(field.id) ?? 0;
        const completionRate = totalResponses > 0 ? answeredCount / totalResponses : 0;
        return {
          id: field.id,
          label: field.label,
          type: field.type,
          required: field.required,
          answeredCount,
          completionRate,
        };
      });

      const recentResponses = await db
        .select({
          id: formResponsesTable.id,
          submittedAt: formResponsesTable.submittedAt,
          respondentEmail: formResponsesTable.respondentEmail,
          respondentName: formResponsesTable.respondentName,
          itemCount: count(formResponseItemsTable.id),
        })
        .from(formResponsesTable)
        .leftJoin(formResponseItemsTable, eq(formResponseItemsTable.responseId, formResponsesTable.id))
        .where(eq(formResponsesTable.formId, input.formId))
        .groupBy(formResponsesTable.id)
        .orderBy(desc(formResponsesTable.submittedAt))
        .limit(8);

      const recentResponseIds = recentResponses.map((row) => row.id);
      const recentResponseItems =
        recentResponseIds.length === 0
          ? []
          : await db
              .select({
                responseId: formResponseItemsTable.responseId,
                fieldId: formResponseItemsTable.fieldId,
                fieldKey: formResponseItemsTable.fieldKey,
                value: formResponseItemsTable.value,
                label: formFieldsTable.label,
                position: formFieldsTable.position,
              })
              .from(formResponseItemsTable)
              .innerJoin(formFieldsTable, eq(formFieldsTable.id, formResponseItemsTable.fieldId))
              .where(
                and(
                  eq(formFieldsTable.formId, input.formId),
                  inArray(formResponseItemsTable.responseId, recentResponseIds),
                ),
              )
              .orderBy(asc(formFieldsTable.position), asc(formResponseItemsTable.createdAt));

      const answersByResponse = new Map<
        string,
        { fieldId: string; fieldKey: string; label: string; value: unknown }[]
      >();
      for (const item of recentResponseItems) {
        const existing = answersByResponse.get(item.responseId) ?? [];
        existing.push({
          fieldId: item.fieldId,
          fieldKey: item.fieldKey,
          label: item.label,
          value: item.value,
        });
        answersByResponse.set(item.responseId, existing);
      }

      const totals = {
        views: totalsFromEvents.views,
        starts: totalsFromEvents.starts,
        submits: submitsInRange,
      };

      const viewToSubmit = totals.views > 0 ? totals.submits / totals.views : 0;
      const startToSubmit = totals.starts > 0 ? totals.submits / totals.starts : 0;

      return {
        form: {
          ...form[0],
          status: form[0].status as z.infer<typeof formStatusSchema>,
          visibility: form[0].visibility as z.infer<typeof formVisibilitySchema>,
          themeKey: form[0].themeKey as z.infer<typeof formThemeKeySchema>,
        },
        totals,
        conversion: {
          viewToSubmit,
          startToSubmit,
        },
        series,
        fields: fieldsWithMetrics,
        recentResponses: recentResponses.map((row) => ({
          ...row,
          itemCount: Number(row.itemCount ?? 0),
          answers: answersByResponse.get(row.id) ?? [],
        })),
      };
    }),

  getResponses: protectedProcedure
    .meta({ openapi: { method: "GET", path: getPath("/{formId}/responses"), tags: TAGS } })
    .input(getResponsesInputSchema)
    .output(
      z.object({
        items: z.array(
          z.object({
            id: z.string().uuid(),
            submittedAt: z.date(),
            respondentEmail: z.string().nullable(),
            respondentName: z.string().nullable(),
            itemCount: z.number().int().nonnegative(),
            answers: z.array(
              z.object({
                fieldId: z.string().uuid(),
                fieldKey: z.string(),
                label: z.string(),
                value: z.unknown(),
              }),
            ),
          }),
        ),
        total: z.number().int().nonnegative(),
        page: z.number().int().positive(),
        pageSize: z.number().int().positive(),
      }),
    )
    .query(async ({ input, ctx }) => {
      await getOwnedFormOrThrow(input.formId, ctx.user.id);

      const predicates = [eq(formResponsesTable.formId, input.formId)];
      if (input.search?.trim()) {
        const search = `%${input.search.trim()}%`;
        predicates.push(
          or(
            ilike(formResponsesTable.respondentName, search),
            ilike(formResponsesTable.respondentEmail, search),
            sql`exists (
              select 1
              from ${formResponseItemsTable} fri
              where fri.response_id = ${formResponsesTable.id}
              and cast(fri.value as text) ilike ${search}
            )`,
          )!,
        );
      }
      if (input.fromDate) predicates.push(gte(formResponsesTable.submittedAt, new Date(input.fromDate)));
      if (input.toDate) predicates.push(lte(formResponsesTable.submittedAt, new Date(input.toDate)));
      const whereClause = and(...predicates);

      const totalRows = await db
        .select({ total: count(formResponsesTable.id) })
        .from(formResponsesTable)
        .where(whereClause);
      const total = Number(totalRows[0]?.total ?? 0);
      const offset = (input.page - 1) * input.pageSize;

      const responses = await db
        .select({
          id: formResponsesTable.id,
          submittedAt: formResponsesTable.submittedAt,
          respondentEmail: formResponsesTable.respondentEmail,
          respondentName: formResponsesTable.respondentName,
          itemCount: count(formResponseItemsTable.id),
        })
        .from(formResponsesTable)
        .leftJoin(formResponseItemsTable, eq(formResponseItemsTable.responseId, formResponsesTable.id))
        .where(whereClause)
        .groupBy(formResponsesTable.id)
        .orderBy(desc(formResponsesTable.submittedAt))
        .limit(input.pageSize)
        .offset(offset);

      const responseIds = responses.map((row) => row.id);
      const answerItems =
        responseIds.length === 0
          ? []
          : await db
              .select({
                responseId: formResponseItemsTable.responseId,
                fieldId: formResponseItemsTable.fieldId,
                fieldKey: formResponseItemsTable.fieldKey,
                value: formResponseItemsTable.value,
                label: formFieldsTable.label,
                position: formFieldsTable.position,
              })
              .from(formResponseItemsTable)
              .innerJoin(formFieldsTable, eq(formFieldsTable.id, formResponseItemsTable.fieldId))
              .where(
                and(
                  eq(formFieldsTable.formId, input.formId),
                  inArray(formResponseItemsTable.responseId, responseIds),
                ),
              )
              .orderBy(asc(formFieldsTable.position), asc(formResponseItemsTable.createdAt));

      const answersByResponse = new Map<
        string,
        { fieldId: string; fieldKey: string; label: string; value: unknown }[]
      >();
      for (const item of answerItems) {
        const bucket = answersByResponse.get(item.responseId) ?? [];
        bucket.push({
          fieldId: item.fieldId,
          fieldKey: item.fieldKey,
          label: item.label,
          value: item.value,
        });
        answersByResponse.set(item.responseId, bucket);
      }

      return {
        items: responses.map((row: (typeof responses)[number]) => ({
          ...row,
          itemCount: Number(row.itemCount ?? 0),
          answers: answersByResponse.get(row.id) ?? [],
        })),
        total,
        page: input.page,
        pageSize: input.pageSize,
      };
    }),

  getResponseDetail: protectedProcedure
    .meta({ openapi: { method: "GET", path: getPath("/{formId}/responses/{responseId}"), tags: TAGS } })
    .input(getResponseDetailInputSchema)
    .output(
      z.object({
        response: z.object({
          id: z.string().uuid(),
          submittedAt: z.date(),
          respondentEmail: z.string().nullable(),
          respondentName: z.string().nullable(),
        }),
        items: z.array(
          z.object({
            id: z.string().uuid(),
            fieldId: z.string().uuid(),
            fieldKey: z.string(),
            label: z.string(),
            type: z.string(),
            required: z.boolean(),
            value: z.unknown(),
          }),
        ),
      }),
    )
    .query(async ({ input, ctx }) => {
      await getOwnedFormOrThrow(input.formId, ctx.user.id);

      const response = await db
        .select({
          id: formResponsesTable.id,
          submittedAt: formResponsesTable.submittedAt,
          respondentEmail: formResponsesTable.respondentEmail,
          respondentName: formResponsesTable.respondentName,
        })
        .from(formResponsesTable)
        .where(and(eq(formResponsesTable.id, input.responseId), eq(formResponsesTable.formId, input.formId)))
        .limit(1);

      if (!response[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Response not found" });
      }

      const items = await db
        .select({
          id: formResponseItemsTable.id,
          fieldId: formResponseItemsTable.fieldId,
          fieldKey: formResponseItemsTable.fieldKey,
          value: formResponseItemsTable.value,
          label: formFieldsTable.label,
          type: formFieldsTable.type,
          required: formFieldsTable.required,
        })
        .from(formResponseItemsTable)
        .innerJoin(formFieldsTable, eq(formFieldsTable.id, formResponseItemsTable.fieldId))
        .where(eq(formResponseItemsTable.responseId, input.responseId))
        .orderBy(asc(formFieldsTable.position), asc(formFieldsTable.createdAt));

      return {
        response: response[0],
        items: items.map((item: (typeof items)[number]) => ({
          ...item,
          type: item.type,
        })),
      };
    }),

  exportResponsesCsv: protectedProcedure
    .meta({ openapi: { method: "GET", path: getPath("/{formId}/responses/export.csv"), tags: TAGS } })
    .input(exportResponsesCsvInputSchema)
    .output(z.object({ filename: z.string(), csv: z.string() }))
    .query(async ({ input, ctx }) => {
      await getOwnedFormOrThrow(input.formId, ctx.user.id);
      const predicates = [eq(formResponsesTable.formId, input.formId)];
      if (input.search?.trim()) {
        const search = `%${input.search.trim()}%`;
        predicates.push(
          or(
            ilike(formResponsesTable.respondentName, search),
            ilike(formResponsesTable.respondentEmail, search),
            sql`exists (
              select 1
              from ${formResponseItemsTable} fri
              where fri.response_id = ${formResponsesTable.id}
              and cast(fri.value as text) ilike ${search}
            )`,
          )!,
        );
      }
      if (input.fromDate) predicates.push(gte(formResponsesTable.submittedAt, new Date(input.fromDate)));
      if (input.toDate) predicates.push(lte(formResponsesTable.submittedAt, new Date(input.toDate)));
      const whereClause = and(...predicates);

      const responses = await db
        .select({
          id: formResponsesTable.id,
          submittedAt: formResponsesTable.submittedAt,
          respondentEmail: formResponsesTable.respondentEmail,
          respondentName: formResponsesTable.respondentName,
        })
        .from(formResponsesTable)
        .where(whereClause)
        .orderBy(desc(formResponsesTable.submittedAt));

      const fields = await db
        .select({ id: formFieldsTable.id, label: formFieldsTable.label, key: formFieldsTable.key, position: formFieldsTable.position })
        .from(formFieldsTable)
        .where(eq(formFieldsTable.formId, input.formId))
        .orderBy(asc(formFieldsTable.position), asc(formFieldsTable.createdAt));

      const responseIds = responses.map((r) => r.id);
      const items = responseIds.length
        ? await db
            .select({
              responseId: formResponseItemsTable.responseId,
              fieldId: formResponseItemsTable.fieldId,
              value: formResponseItemsTable.value,
            })
            .from(formResponseItemsTable)
            .where(inArray(formResponseItemsTable.responseId, responseIds))
        : [];
      const byResponse = new Map<string, Map<string, unknown>>();
      for (const item of items) {
        const bucket = byResponse.get(item.responseId) ?? new Map<string, unknown>();
        bucket.set(item.fieldId, item.value);
        byResponse.set(item.responseId, bucket);
      }

      const headers = ["responseId", "submittedAt", "respondentName", "respondentEmail", ...fields.map((f) => f.label || f.key)];
      const lines = [headers.map((h) => toCsvCell(h)).join(",")];
      for (const response of responses) {
        const valueMap = byResponse.get(response.id) ?? new Map<string, unknown>();
        const row = [
          toCsvCell(response.id),
          toCsvCell(response.submittedAt.toISOString()),
          toCsvCell(response.respondentName ?? ""),
          toCsvCell(response.respondentEmail ?? ""),
          ...fields.map((f) => toCsvCell(valueMap.get(f.id))),
        ];
        lines.push(row.join(","));
      }

      return {
        filename: `form-${input.formId}-responses.csv`,
        csv: lines.join("\n"),
      };
    }),

  markAsTemplate: protectedProcedure
    .meta({ openapi: { method: "POST", path: getPath("/{formId}/template"), tags: TAGS } })
    .input(markAsTemplateInputSchema)
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      await getOwnedFormOrThrow(input.formId, ctx.user.id);
      await db.update(formsTable).set({ isTemplate: input.isTemplate, updatedAt: new Date() }).where(eq(formsTable.id, input.formId));
      return { success: true };
    }),

  listTemplates: protectedProcedure
    .meta({ openapi: { method: "GET", path: getPath("/templates"), tags: TAGS } })
    .input(zodUndefinedModel)
    .output(
      z.array(
        z.object({
          id: z.string().uuid(),
          title: z.string(),
          description: z.string().nullable(),
          themeKey: formThemeKeySchema,
          isFeatured: z.boolean(),
          ownerId: z.string().uuid(),
        }),
      ),
    )
    .query(async ({ ctx }) => {
      const rows = await db
        .select({
          id: formsTable.id,
          title: formsTable.title,
          description: formsTable.description,
          themeKey: formsTable.themeKey,
          isFeatured: formsTable.isFeatured,
          ownerId: formsTable.ownerId,
        })
        .from(formsTable)
        .where(and(eq(formsTable.isTemplate, true), or(eq(formsTable.isFeatured, true), eq(formsTable.ownerId, ctx.user.id))!))
        .orderBy(desc(formsTable.isFeatured), desc(formsTable.updatedAt));
      return rows.map((r) => ({ ...r, themeKey: r.themeKey as z.infer<typeof formThemeKeySchema> }));
    }),

  cloneTemplate: protectedProcedure
    .meta({ openapi: { method: "POST", path: getPath("/templates/clone"), tags: TAGS } })
    .input(cloneTemplateInputSchema)
    .output(z.object({ formId: z.string().uuid(), slug: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const templateRows = await db
        .select({
          id: formsTable.id,
          title: formsTable.title,
          description: formsTable.description,
          themeKey: formsTable.themeKey,
          visibility: formsTable.visibility,
          isTemplate: formsTable.isTemplate,
        })
        .from(formsTable)
        .where(eq(formsTable.id, input.templateFormId))
        .limit(1);
      const template = templateRows[0];
      if (!template || !template.isTemplate) throw new TRPCError({ code: "NOT_FOUND", message: "Template not found" });
      const slug = await generateUniqueSlug(input.title ?? `${template.title} copy`);
      const inserted = await db
        .insert(formsTable)
        .values({
          ownerId: ctx.user.id,
          title: input.title ?? `${template.title} copy`,
          description: template.description,
          slug,
          visibility: template.visibility as (typeof formVisibilityEnum.enumValues)[number],
          themeKey: template.themeKey,
        })
        .returning({ id: formsTable.id, slug: formsTable.slug });
      const newFormId = inserted[0]!.id;

      const templateFields = await db
        .select({
          key: formFieldsTable.key,
          type: formFieldsTable.type,
          label: formFieldsTable.label,
          helperText: formFieldsTable.helperText,
          placeholder: formFieldsTable.placeholder,
          required: formFieldsTable.required,
          position: formFieldsTable.position,
          config: formFieldsTable.config,
        })
        .from(formFieldsTable)
        .where(eq(formFieldsTable.formId, template.id))
        .orderBy(asc(formFieldsTable.position), asc(formFieldsTable.createdAt));
      if (templateFields.length > 0) {
        await db.insert(formFieldsTable).values(
          templateFields.map((f) => ({
            formId: newFormId,
            key: f.key,
            type: f.type,
            label: f.label,
            helperText: f.helperText,
            placeholder: f.placeholder,
            required: f.required,
            position: f.position,
            config: f.config,
          })),
        );
      }
      await db.insert(formPublicSettingsTable).values({ formId: newFormId }).onConflictDoNothing();
      return { formId: newFormId, slug: inserted[0]!.slug };
    }),

  submitResponse: publicProcedure
    .meta({ openapi: { method: "POST", path: getPath("/{formId}/submit"), tags: TAGS } })
    .input(submitResponseInputSchema)
    .output(z.object({ success: z.boolean(), responseId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      if (env.TURNSTILE_SECRET_KEY) {
        if (!input.captchaToken) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Human verification is required" });
        }
        const humanVerified = await verifyTurnstileToken({ token: input.captchaToken, ip: ctx.clientIp });
        if (!humanVerified) {
          throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Human verification failed" });
        }
      }

      const form = await db
        .select({
          id: formsTable.id,
          status: formsTable.status,
          closeMessage: formPublicSettingsTable.closeMessage,
          maxResponses: formPublicSettingsTable.maxResponses,
          expiresAt: formPublicSettingsTable.expiresAt,
          passwordHash: formPublicSettingsTable.passwordHash,
          collectRespondentEmail: formPublicSettingsTable.collectRespondentEmail,
        })
        .from(formsTable)
        .leftJoin(formPublicSettingsTable, eq(formPublicSettingsTable.formId, formsTable.id))
        .where(eq(formsTable.id, input.formId))
        .limit(1);

      if (!form[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Form not found" });
      }

      if (form[0].status !== "PUBLISHED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Only published forms can accept submissions" });
      }
      const responseCountRows = await db
        .select({ total: count(formResponsesTable.id) })
        .from(formResponsesTable)
        .where(eq(formResponsesTable.formId, input.formId));
      const closeState = computeCloseState({
        expiresAt: form[0].expiresAt,
        maxResponses: form[0].maxResponses,
        responseCount: Number(responseCountRows[0]?.total ?? 0),
      });
      if (closeState.isClosed) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            closeState.closeReason === "EXPIRED"
              ? "This form has expired."
              : "This form has reached the maximum number of responses.",
        });
      }
      if (form[0].passwordHash) {
        const unlocked = ctx.cookies[protectedCookieName(input.formId)] === "1";
        if (!unlocked) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Form password is required" });
        }
      }
      if (form[0].collectRespondentEmail && !input.respondentEmail) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Respondent email is required for this form" });
      }

      const submitterIpHash = ctx.clientIp ? hashSubmitterIp(ctx.clientIp) : null;
      if (submitterIpHash) {
        const now = Date.now();
        const windowMs = env.FORM_SUBMIT_RATE_LIMIT_WINDOW_SECONDS * 1000;
        const windowStart = new Date(now - windowMs);

        const [globalByIp, perFormByIp] = await Promise.all([
          db
            .select({ total: count(formResponsesTable.id) })
            .from(formResponsesTable)
            .where(and(eq(formResponsesTable.submitterIpHash, submitterIpHash), gte(formResponsesTable.submittedAt, windowStart))),
          db
            .select({ total: count(formResponsesTable.id) })
            .from(formResponsesTable)
            .where(
              and(
                eq(formResponsesTable.submitterIpHash, submitterIpHash),
                eq(formResponsesTable.formId, input.formId),
                gte(formResponsesTable.submittedAt, windowStart),
              ),
            ),
        ]);

        const globalCount = Number(globalByIp[0]?.total ?? 0);
        const perFormCount = Number(perFormByIp[0]?.total ?? 0);

        if (globalCount >= env.FORM_SUBMIT_RATE_LIMIT_MAX_PER_IP_WINDOW) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "Rate limit exceeded. Please wait before submitting again.",
          });
        }

        if (perFormCount >= env.FORM_SUBMIT_RATE_LIMIT_MAX_PER_IP_FORM_WINDOW) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "Rate limit exceeded for this form. Please try again shortly.",
          });
        }
      }

      const fields = await db
        .select({
          id: formFieldsTable.id,
          label: formFieldsTable.label,
          key: formFieldsTable.key,
          type: formFieldsTable.type,
          required: formFieldsTable.required,
          config: formFieldsTable.config,
        })
        .from(formFieldsTable)
        .where(eq(formFieldsTable.formId, input.formId));

      const answersByFieldId = new Map(input.answers.map((a) => [a.fieldId, a.value] as const));
      const visibleFields = fields.filter((field) =>
        isFieldVisible({ config: (field as { config?: Record<string, unknown> }).config ?? {} }, answersByFieldId),
      );

      for (const field of visibleFields) {
        if (field.required) {
          const answer = input.answers.find(a => a.fieldId === field.id);
          if (!answer || isValueEmpty(answer.value)) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Field "${field.key}" is required.`,
            });
          }
        }
      }
      const visibleFieldIds = new Set(visibleFields.map((f) => f.id));
      const normalizedAnswers = input.answers.filter((a) => visibleFieldIds.has(a.fieldId));

      const headerInserted = await db
        .insert(formResponsesTable)
        .values({
          formId: input.formId,
          respondentEmail: input.respondentEmail ?? null,
          respondentName: input.respondentName ?? null,
          submitterIpHash,
          submitterUserAgent:
            typeof ctx.headers["user-agent"] === "string" ? ctx.headers["user-agent"] : null,
        })
        .returning({ id: formResponsesTable.id });

      const responseId = headerInserted[0]!.id;
      const submittedAt = new Date();

      if (normalizedAnswers.length > 0) {
        await db.insert(formResponseItemsTable).values(
          normalizedAnswers.map(ans => ({
            responseId,
            fieldId: ans.fieldId,
            fieldKey: ans.fieldKey,
            value: ans.value ?? null,
          })),
        );
      }

      await db.insert(analyticsEventsTable).values({
        formId: input.formId,
        responseId,
        eventType: "SUBMIT",
        sessionKey: input.sessionKey ?? null,
        metadata: {},
      });

      const notificationContext = await db
        .select({
          formTitle: formsTable.title,
          ownerEmail: usersTable.email,
          ownerId: formsTable.ownerId,
          creatorNotificationsEnabled: formPublicSettingsTable.creatorNotificationsEnabled,
          respondentEmailCopyEnabled: formPublicSettingsTable.respondentEmailCopyEnabled,
          creatorNotificationMode: formPublicSettingsTable.creatorNotificationMode,
          creatorDigestIntervalHours: formPublicSettingsTable.creatorDigestIntervalHours,
          lastDigestSentAt: formPublicSettingsTable.lastDigestSentAt,
        })
        .from(formsTable)
        .innerJoin(usersTable, eq(usersTable.id, formsTable.ownerId))
        .leftJoin(formPublicSettingsTable, eq(formPublicSettingsTable.formId, formsTable.id))
        .where(eq(formsTable.id, input.formId))
        .limit(1);

      const notify = notificationContext[0];
      const respondentEmailCopyEnabled = Boolean(notify?.respondentEmailCopyEnabled ?? true);
      const sendRespondentCopy = Boolean(
        respondentEmailCopyEnabled && input.sendRespondentCopy && input.respondentEmail,
      );

      if (sendRespondentCopy && input.respondentEmail && notify?.formTitle) {
        const respondentAnswers = fields.map((field) => {
          const answer = normalizedAnswers.find((a) => a.fieldId === field.id);
          return {
            label: field.label || field.key,
            value: answer?.value ?? null,
          };
        });
        const recipientName = input.respondentName?.trim() || "there";

        try {
          const sent = await resendClient.emails.send({
            from: env.RESEND_FROM_EMAIL,
            to: input.respondentEmail,
            subject: `Your response copy for ${notify.formTitle}`,
            html: buildRespondentReceiptHtml({
              formTitle: notify.formTitle,
              respondentName: recipientName,
              submittedAt,
              answers: respondentAnswers,
            }),
          });

          await db.insert(emailLogsTable).values({
            formId: input.formId,
            responseId,
            recipientEmail: input.respondentEmail,
            emailType: "respondent_response_copy",
            providerMessageId: sent.data?.id ?? null,
            status: "SENT",
            metadata: {
              kind: "RESPONDENT_COPY",
            },
            sentAt: new Date(),
          });
        } catch (error) {
          await db.insert(emailLogsTable).values({
            formId: input.formId,
            responseId,
            recipientEmail: input.respondentEmail,
            emailType: "respondent_response_copy",
            status: "FAILED",
            errorMessage: error instanceof Error ? error.message : "Unknown email error",
            metadata: {
              kind: "RESPONDENT_COPY",
            },
          });
        }
      }

      if (notify?.creatorNotificationsEnabled && notify.ownerEmail) {
        const responseLink = `${env.FRONTEND_URL}/dashboard/forms/${input.formId}/responses`;
        const recipientName = input.respondentName?.trim() || "Anonymous";
        const recipientEmail = input.respondentEmail?.trim() || "Not provided";
        const mode = notify.creatorNotificationMode ?? "IMMEDIATE";
        const digestIntervalHours = notify.creatorDigestIntervalHours ?? 1;

        const sendAndTrackEmail = async (params: {
          emailType: string;
          subject: string;
          html: string;
          metadata: Record<string, unknown>;
        }) => {
          try {
            const sent = await resendClient.emails.send({
              from: env.RESEND_FROM_EMAIL,
              to: notify.ownerEmail,
              subject: params.subject,
              html: params.html,
            });

            await db.insert(emailLogsTable).values({
              formId: input.formId,
              responseId,
              recipientEmail: notify.ownerEmail,
              emailType: params.emailType,
              providerMessageId: sent.data?.id ?? null,
              status: "SENT",
              metadata: params.metadata,
              sentAt: new Date(),
            });
          } catch (error) {
            await db.insert(emailLogsTable).values({
              formId: input.formId,
              responseId,
              recipientEmail: notify.ownerEmail,
              emailType: params.emailType,
              status: "FAILED",
              errorMessage: error instanceof Error ? error.message : "Unknown email error",
              metadata: params.metadata,
            });
          }
        };

        if (mode === "IMMEDIATE") {
          await sendAndTrackEmail({
            emailType: "creator_response_immediate",
            subject: `New response on ${notify.formTitle}`,
            html: buildImmediateNotificationHtml({
              formTitle: notify.formTitle,
              responseLink,
              respondentName: recipientName,
              respondentEmail: recipientEmail,
              submittedAt: new Date(),
            }),
            metadata: {
              mode: "IMMEDIATE",
            },
          });
        } else {
          const now = new Date();
          const intervalMs = digestIntervalHours * 60 * 60 * 1000;
          const lastDigest = notify.lastDigestSentAt ? new Date(notify.lastDigestSentAt) : null;
          const shouldSendDigest = !lastDigest || now.getTime() - lastDigest.getTime() >= intervalMs;

          if (shouldSendDigest) {
            const digestFrom = lastDigest ?? new Date(now.getTime() - intervalMs);
            const digestCountRows = await db
              .select({ total: count(formResponsesTable.id) })
              .from(formResponsesTable)
              .where(and(eq(formResponsesTable.formId, input.formId), gte(formResponsesTable.submittedAt, digestFrom)));
            const digestCount = Number(digestCountRows[0]?.total ?? 0);

            if (digestCount > 0) {
              await sendAndTrackEmail({
                emailType: "creator_response_digest",
                subject: `${digestCount} new responses on ${notify.formTitle}`,
                html: buildDigestNotificationHtml({
                  formTitle: notify.formTitle,
                  count: digestCount,
                  intervalHours: digestIntervalHours,
                  responseLink,
                }),
                metadata: {
                  mode: "DIGEST",
                  intervalHours: digestIntervalHours,
                  count: digestCount,
                },
              });

              await db
                .update(formPublicSettingsTable)
                .set({ lastDigestSentAt: now, updatedAt: now })
                .where(eq(formPublicSettingsTable.formId, input.formId));
            }
          }
        }
      }

      return { success: true, responseId };
    }),
});
