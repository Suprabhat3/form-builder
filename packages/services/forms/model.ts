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
  config: z.record(z.string(), z.unknown()).optional(),
});

export const updateFormFieldInputSchema = z.object({
  formId: z.string().uuid(),
  fieldId: z.string().uuid(),
  label: z.string().optional(),
  helperText: z.string().optional(),
  placeholder: z.string().optional(),
  required: z.boolean().optional(),
  config: z.record(z.string(), z.unknown()).optional(),
});

export const reorderFormFieldsInputSchema = z.object({
  formId: z.string().uuid(),
  fieldIdsInOrder: z.array(z.string().uuid()),
});
