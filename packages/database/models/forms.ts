import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

export const formStatusEnum = pgEnum("form_status", ["DRAFT", "PUBLISHED", "UNPUBLISHED", "ARCHIVED"]);
export const formVisibilityEnum = pgEnum("form_visibility", ["PUBLIC", "UNLISTED"]);
export const fieldTypeEnum = pgEnum("field_type", [
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
export const analyticsEventEnum = pgEnum("analytics_event_type", ["VIEW", "START", "SUBMIT"]);
export const emailStatusEnum = pgEnum("email_status", ["PENDING", "SENT", "FAILED"]);
export const creatorNotificationModeEnum = pgEnum("creator_notification_mode", ["IMMEDIATE", "DIGEST"]);

export const formsTable = pgTable("forms", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 180 }).notNull(),
  description: text("description"),
  slug: varchar("slug", { length: 180 }).notNull().unique(),
  status: formStatusEnum("status").notNull().default("DRAFT"),
  visibility: formVisibilityEnum("visibility").notNull().default("UNLISTED"),
  themeKey: varchar("theme_key", { length: 100 }).notNull().default("default"),
  isTemplate: boolean("is_template").notNull().default(false),
  isFeatured: boolean("is_featured").notNull().default(false),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const formPublicSettingsTable = pgTable("form_public_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  formId: uuid("form_id")
    .notNull()
    .unique()
    .references(() => formsTable.id, { onDelete: "cascade" }),
  successMessage: text("success_message"),
  closeMessage: text("close_message"),
  passwordHash: text("password_hash"),
  maxResponses: integer("max_responses"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  collectRespondentEmail: boolean("collect_respondent_email").notNull().default(false),
  showProgressBar: boolean("show_progress_bar").notNull().default(true),
  creatorNotificationsEnabled: boolean("creator_notifications_enabled").notNull().default(false),
  respondentEmailCopyEnabled: boolean("respondent_email_copy_enabled").notNull().default(true),
  creatorNotificationMode: creatorNotificationModeEnum("creator_notification_mode").notNull().default("IMMEDIATE"),
  creatorDigestIntervalHours: integer("creator_digest_interval_hours").notNull().default(1),
  lastDigestSentAt: timestamp("last_digest_sent_at", { withTimezone: true }),
  thankYouTitle: varchar("thank_you_title", { length: 180 }),
  thankYouBody: text("thank_you_body"),
  thankYouCtaText: varchar("thank_you_cta_text", { length: 120 }),
  thankYouCtaUrl: text("thank_you_cta_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const formFieldsTable = pgTable(
  "form_fields",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    formId: uuid("form_id")
      .notNull()
      .references(() => formsTable.id, { onDelete: "cascade" }),
    key: varchar("key", { length: 100 }).notNull(),
    type: fieldTypeEnum("type").notNull(),
    label: varchar("label", { length: 180 }).notNull(),
    helperText: text("helper_text"),
    placeholder: text("placeholder"),
    required: boolean("required").notNull().default(false),
    position: integer("position").notNull(),
    config: jsonb("config").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    formFieldKeyUnique: unique("form_field_key_unique").on(table.formId, table.key),
  }),
);

export const formResponsesTable = pgTable("form_responses", {
  id: uuid("id").primaryKey().defaultRandom(),
  formId: uuid("form_id")
    .notNull()
    .references(() => formsTable.id, { onDelete: "cascade" }),
  respondentEmail: varchar("respondent_email", { length: 255 }),
  respondentName: varchar("respondent_name", { length: 120 }),
  submitterIpHash: varchar("submitter_ip_hash", { length: 128 }),
  submitterUserAgent: text("submitter_user_agent"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const formResponseItemsTable = pgTable(
  "form_response_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    responseId: uuid("response_id")
      .notNull()
      .references(() => formResponsesTable.id, { onDelete: "cascade" }),
    fieldId: uuid("field_id")
      .notNull()
      .references(() => formFieldsTable.id, { onDelete: "cascade" }),
    fieldKey: varchar("field_key", { length: 100 }).notNull(),
    value: jsonb("value").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    responseFieldUnique: unique("response_field_unique").on(table.responseId, table.fieldId),
  }),
);

export const analyticsEventsTable = pgTable("analytics_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  formId: uuid("form_id")
    .notNull()
    .references(() => formsTable.id, { onDelete: "cascade" }),
  responseId: uuid("response_id").references(() => formResponsesTable.id, { onDelete: "set null" }),
  eventType: analyticsEventEnum("event_type").notNull(),
  sessionKey: varchar("session_key", { length: 128 }),
  source: varchar("source", { length: 120 }),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const emailLogsTable = pgTable("email_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  formId: uuid("form_id").references(() => formsTable.id, { onDelete: "set null" }),
  responseId: uuid("response_id").references(() => formResponsesTable.id, { onDelete: "set null" }),
  recipientEmail: varchar("recipient_email", { length: 255 }).notNull(),
  emailType: varchar("email_type", { length: 60 }).notNull(),
  providerMessageId: varchar("provider_message_id", { length: 255 }),
  status: emailStatusEnum("status").notNull().default("PENDING"),
  errorMessage: text("error_message"),
  metadata: jsonb("metadata").notNull().default({}),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const adminAuditLogsTable = pgTable("admin_audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorUserId: uuid("actor_user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  targetFormId: uuid("target_form_id").references(() => formsTable.id, { onDelete: "set null" }),
  action: varchar("action", { length: 80 }).notNull(),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const formsRelations = relations(formsTable, ({ one, many }) => ({
  owner: one(usersTable, { fields: [formsTable.ownerId], references: [usersTable.id] }),
  publicSettings: one(formPublicSettingsTable, {
    fields: [formsTable.id],
    references: [formPublicSettingsTable.formId],
  }),
  fields: many(formFieldsTable),
  responses: many(formResponsesTable),
  analyticsEvents: many(analyticsEventsTable),
}));

export const formFieldsRelations = relations(formFieldsTable, ({ one, many }) => ({
  form: one(formsTable, { fields: [formFieldsTable.formId], references: [formsTable.id] }),
  responseItems: many(formResponseItemsTable),
}));

export const formResponsesRelations = relations(formResponsesTable, ({ one, many }) => ({
  form: one(formsTable, { fields: [formResponsesTable.formId], references: [formsTable.id] }),
  items: many(formResponseItemsTable),
}));

export const formResponseItemsRelations = relations(formResponseItemsTable, ({ one }) => ({
  response: one(formResponsesTable, {
    fields: [formResponseItemsTable.responseId],
    references: [formResponsesTable.id],
  }),
  field: one(formFieldsTable, { fields: [formResponseItemsTable.fieldId], references: [formFieldsTable.id] }),
}));
