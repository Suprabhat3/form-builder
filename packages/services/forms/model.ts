import { z } from "zod";

export const formStatusSchema = z.enum(["DRAFT", "PUBLISHED", "UNPUBLISHED", "ARCHIVED"]);
export const formVisibilitySchema = z.enum(["PUBLIC", "UNLISTED"]);
export const creatorNotificationModeSchema = z.enum(["IMMEDIATE", "DIGEST"]);
export const creatorDigestIntervalHoursSchema = z.union([z.literal(1), z.literal(5), z.literal(24)]);

export const fieldTypeSchema = z.enum([
  "SHORT_TEXT",
  "LONG_TEXT",
  "EMAIL",
  "NUMBER",
  "SINGLE_SELECT",
  "MULTI_SELECT",
  "CHECKBOX",
  "RATING",
  "DATE",
]);

export const formFieldConfigSchema = z
  .object({
    options: z.array(z.string()).min(1).optional(),
    maxLength: z.number().int().positive().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    minDate: z.string().optional(),
    maxDate: z.string().optional(),
    maxRating: z.number().int().positive().optional(),
    visibilityRules: z
      .object({
        all: z.array(
          z.object({
            fieldId: z.string().uuid(),
            operator: z.enum(["equals", "not_equals", "contains", "not_contains", "is_empty", "is_not_empty"]),
            value: z.unknown().optional(),
          }),
        ),
      })
      .optional(),
  })
  .strict();

export const formThemeCatalog = [
  { key: "movie-noir", label: "Movie Noir", category: "Movies" },
  { key: "anime-neon", label: "Anime Neon", category: "Anime" },
  { key: "retro-arcade", label: "Retro Arcade", category: "Games" },
  { key: "silicon-minimal", label: "Silicon Minimal", category: "Tech Companies" },
  { key: "terminal-hacker", label: "Terminal Hacker", category: "Operating Systems" },
  { key: "startup-pitch", label: "Startup Pitch", category: "Startups" },
  { key: "hackathon-rush", label: "Hackathon Rush", category: "Events" },
  { key: "community-warm", label: "Community Warm", category: "Communities" },
] as const;

export const formThemeKeySchema = z.enum([
  "movie-noir",
  "anime-neon",
  "retro-arcade",
  "silicon-minimal",
  "terminal-hacker",
  "startup-pitch",
  "hackathon-rush",
  "community-warm"
]);

export const createFormInputSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  themeKey: formThemeKeySchema,
  visibility: formVisibilitySchema,
});

export const formIdInputSchema = z.object({
  formId: z.string().uuid(),
});

export const updateFormInputSchema = z.object({
  formId: z.string().uuid(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  visibility: formVisibilitySchema.optional(),
  themeKey: formThemeKeySchema.optional(),
  creatorNotificationsEnabled: z.boolean().optional(),
  respondentEmailCopyEnabled: z.boolean().optional(),
  collectRespondentEmail: z.boolean().optional(),
  showProgressBar: z.boolean().optional(),
  maxResponses: z.number().int().positive().nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  closeMessage: z.string().nullable().optional(),
  successMessage: z.string().nullable().optional(),
  password: z.string().min(4).nullable().optional(),
  thankYouTitle: z.string().nullable().optional(),
  thankYouBody: z.string().nullable().optional(),
  thankYouCtaText: z.string().nullable().optional(),
  thankYouCtaUrl: z.string().url().nullable().optional(),
  creatorNotificationMode: creatorNotificationModeSchema.optional(),
  creatorDigestIntervalHours: creatorDigestIntervalHoursSchema.optional(),
});

export const formFieldIdInputSchema = z.object({
  formId: z.string().uuid(),
  fieldId: z.string().uuid(),
});

export const addFormFieldInputSchema = z.object({
  formId: z.string().uuid(),
  type: fieldTypeSchema,
  label: z.string(),
  key: z.string().optional(),
  helperText: z.string().optional(),
  placeholder: z.string().optional(),
  required: z.boolean().default(false),
  config: formFieldConfigSchema.optional(),
});

export const updateFormFieldInputSchema = z.object({
  formId: z.string().uuid(),
  fieldId: z.string().uuid(),
  label: z.string().optional(),
  helperText: z.string().optional(),
  placeholder: z.string().optional(),
  required: z.boolean().optional(),
  config: formFieldConfigSchema.optional(),
});

export const reorderFormFieldsInputSchema = z.object({
  formId: z.string().uuid(),
  fieldIdsInOrder: z.array(z.string().uuid()),
});

export const analyticsEventTypeSchema = z.enum(["VIEW", "START", "SUBMIT"]);

export const recordAnalyticsEventInputSchema = z.object({
  formId: z.string().uuid(),
  eventType: analyticsEventTypeSchema.refine((value) => value !== "SUBMIT", {
    message: "SUBMIT is recorded automatically",
  }),
  sessionKey: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const getBySlugInputSchema = z.object({
  slug: z.string(),
});

export const getAnalyticsOverviewInputSchema = z.object({
  formId: z.string().uuid(),
  rangeDays: z.number().int().min(1).max(365).default(30),
});

export const getResponsesInputSchema = z.object({
  formId: z.string().uuid(),
  search: z.string().optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(200).default(50),
});

export const exportResponsesCsvInputSchema = z.object({
  formId: z.string().uuid(),
  search: z.string().optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
});

export const getResponseDetailInputSchema = z.object({
  formId: z.string().uuid(),
  responseId: z.string().uuid(),
});

export const submitResponseInputSchema = z.object({
  formId: z.string().uuid(),
  respondentEmail: z.string().email().optional().nullable(),
  respondentName: z.string().optional().nullable(),
  sendRespondentCopy: z.boolean().optional().default(false),
  sessionKey: z.string().optional().nullable(),
  captchaToken: z.string().min(1).optional().nullable(),
  answers: z.array(
    z.object({
      fieldId: z.string().uuid(),
      fieldKey: z.string(),
      value: z.unknown(),
    }),
  ),
});

export const unlockProtectedFormInputSchema = z.object({
  slug: z.string(),
  password: z.string().min(1),
});

export const markAsTemplateInputSchema = z.object({
  formId: z.string().uuid(),
  isTemplate: z.boolean(),
});

export const cloneTemplateInputSchema = z.object({
  templateFormId: z.string().uuid(),
  title: z.string().min(1).optional(),
});

export const adminModerateFormInputSchema = z.object({
  formId: z.string().uuid(),
  action: z.enum(["ARCHIVE", "UNPUBLISH", "PUBLISH"]),
});

export const adminFeatureTemplateInputSchema = z.object({
  formId: z.string().uuid(),
  isFeatured: z.boolean(),
});
