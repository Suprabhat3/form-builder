import { TRPCError } from "@trpc/server";
import { and, asc, count, desc, eq } from "../../../../database";
import {
  formFieldsTable,
  formResponsesTable,
  formsTable,
  fieldTypeEnum,
  formStatusEnum,
  formVisibilityEnum,
} from "../../../../database/schema";
import {
  addFormFieldInputSchema,
  createFormInputSchema,
  formFieldIdInputSchema,
  formIdInputSchema,
  formStatusSchema,
  formThemeCatalog,
  formThemeKeySchema,
  formVisibilitySchema,
  reorderFormFieldsInputSchema,
  updateFormFieldInputSchema,
  updateFormInputSchema,
} from "@repo/services/forms/model";
import { z, zodUndefinedModel } from "../../schema";
import { protectedProcedure, router } from "../../trpc";
import { db } from "../../../../database";

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

export const formRouter = router({
  getThemeCatalog: protectedProcedure
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

      return inserted[0]!;
    }),

  listMine: protectedProcedure
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
        responseCount: Number(row.responseCount ?? 0),
      }));
    }),

  getById: protectedProcedure
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
        })
        .from(formsTable)
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
        fields: fields.map((f: (typeof fields)[number]) => ({
          ...f,
          type: f.type,
          config: (f.config as Record<string, unknown>) ?? {},
        })),
      };
    }),

  update: protectedProcedure
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

      return { success: true };
    }),

  publish: protectedProcedure
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
});
