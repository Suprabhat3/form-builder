import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { db, dbPool } from "./index";
import {
  accountsTable,
  analyticsEventsTable,
  formFieldsTable,
  formPublicSettingsTable,
  formResponseItemsTable,
  formResponsesTable,
  formsTable,
  usersTable,
} from "./schema";

const SEED_PASSWORD = "Demo123!";

type SeedField = {
  key: string;
  type:
    | "SHORT_TEXT"
    | "LONG_TEXT"
    | "EMAIL"
    | "NUMBER"
    | "SINGLE_SELECT"
    | "MULTI_SELECT"
    | "RATING"
    | "CHECKBOX"
    | "DATE";
  label: string;
  required?: boolean;
  placeholder?: string;
  config?: Record<string, unknown>;
};

type SeedForm = {
  slug: string;
  title: string;
  description: string;
  status: "DRAFT" | "PUBLISHED" | "UNPUBLISHED" | "ARCHIVED";
  visibility: "PUBLIC" | "UNLISTED";
  themeKey: string;
  fields: SeedField[];
  sampleResponses?: Array<Record<string, unknown>>;
};

type SeedUser = {
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  plan?: "FREE" | "STARTER" | "PRO" | "BUSINESS";
  forms: SeedForm[];
};

const seedUsers: SeedUser[] = [
  {
    name: "Admin",
    email: "admin@zenform.com",
    role: "ADMIN",
    plan: "BUSINESS",
    forms: [],
  },
  {
    name: "Suprabhat",
    email: "suprabhat@zenform.com",
    role: "USER",
    plan: "PRO",
    forms: [
      {
        slug: "customer-feedback-survey",
        title: "Customer Feedback Survey",
        description: "Collect product feedback from customers after purchase.",
        status: "PUBLISHED",
        visibility: "PUBLIC",
        themeKey: "silicon-minimal",
        fields: [
          { key: "short_text_1", type: "SHORT_TEXT", label: "Full name", required: true },
          { key: "email_2", type: "EMAIL", label: "Email address", required: true },
          {
            key: "single_select_3",
            type: "SINGLE_SELECT",
            label: "How satisfied are you?",
            required: true,
            config: { options: ["Very satisfied", "Satisfied", "Neutral", "Dissatisfied"] },
          },
          { key: "rating_4", type: "RATING", label: "Overall rating", required: true, config: { maxRating: 5 } },
          { key: "long_text_5", type: "LONG_TEXT", label: "What can we improve?", placeholder: "Share your thoughts..." },
        ],
        sampleResponses: [
          {
            short_text_1: "Jordan Lee",
            email_2: "jordan@example.com",
            single_select_3: "Very satisfied",
            rating_4: 5,
            long_text_5: "Great onboarding experience.",
          },
          {
            short_text_1: "Sam Patel",
            email_2: "sam@example.com",
            single_select_3: "Neutral",
            rating_4: 3,
            long_text_5: "Would like more template options.",
          },
          {
            short_text_1: "Taylor Kim",
            email_2: "taylor@example.com",
            single_select_3: "Satisfied",
            rating_4: 4,
            long_text_5: "Clean UI and fast form builder.",
          },
        ],
      },
      {
        slug: "event-registration",
        title: "Event Registration",
        description: "Register attendees for the upcoming community meetup.",
        status: "PUBLISHED",
        visibility: "PUBLIC",
        themeKey: "hackathon-rush",
        fields: [
          { key: "short_text_1", type: "SHORT_TEXT", label: "Name", required: true },
          { key: "email_2", type: "EMAIL", label: "Email", required: true },
          {
            key: "single_select_3",
            type: "SINGLE_SELECT",
            label: "Ticket type",
            required: true,
            config: { options: ["General admission", "VIP", "Student"] },
          },
          { key: "date_4", type: "DATE", label: "Preferred session date", required: true },
        ],
        sampleResponses: [
          {
            short_text_1: "Morgan Wright",
            email_2: "morgan@example.com",
            single_select_3: "General admission",
            date_4: "2026-06-15",
          },
        ],
      },
      {
        slug: "product-launch-draft",
        title: "Product Launch Waitlist",
        description: "Draft waitlist form for the next release.",
        status: "DRAFT",
        visibility: "UNLISTED",
        themeKey: "startup-pitch",
        fields: [
          { key: "email_1", type: "EMAIL", label: "Work email", required: true },
          { key: "short_text_2", type: "SHORT_TEXT", label: "Company name" },
        ],
      },
    ],
  },
  {
    name: "Piyush",
    email: "piyush@zenform.com",
    role: "USER",
    plan: "STARTER",
    forms: [
      {
        slug: "job-application",
        title: "Job Application",
        description: "Apply for open roles on our team.",
        status: "PUBLISHED",
        visibility: "PUBLIC",
        themeKey: "movie-noir",
        fields: [
          { key: "short_text_1", type: "SHORT_TEXT", label: "Full name", required: true },
          { key: "email_2", type: "EMAIL", label: "Email", required: true },
          {
            key: "single_select_3",
            type: "SINGLE_SELECT",
            label: "Role applying for",
            required: true,
            config: { options: ["Frontend Engineer", "Backend Engineer", "Product Designer"] },
          },
          { key: "long_text_4", type: "LONG_TEXT", label: "Why do you want to join?", required: true },
          { key: "checkbox_5", type: "CHECKBOX", label: "Available to start within 30 days", required: true },
        ],
        sampleResponses: [
          {
            short_text_1: "Casey Nguyen",
            email_2: "casey@example.com",
            single_select_3: "Frontend Engineer",
            long_text_4: "I love building polished form experiences.",
            checkbox_5: true,
          },
          {
            short_text_1: "Riley Adams",
            email_2: "riley@example.com",
            single_select_3: "Product Designer",
            long_text_4: "Excited about design systems and UX research.",
            checkbox_5: true,
          },
        ],
      },
      {
        slug: "product-research",
        title: "Product Research",
        description: "Help us prioritize the next features.",
        status: "DRAFT",
        visibility: "UNLISTED",
        themeKey: "community-warm",
        fields: [
          {
            key: "multi_select_1",
            type: "MULTI_SELECT",
            label: "Which features matter most?",
            config: { options: ["Templates", "Analytics", "Integrations", "Collaboration"] },
          },
          { key: "rating_2", type: "RATING", label: "Current product rating", config: { maxRating: 5 } },
        ],
      },
    ],
  },
];

async function ensureUser(user: SeedUser, passwordHash: string): Promise<string> {
  const email = user.email.toLowerCase();
  const existing = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, email)).limit(1);

  if (existing[0]) {
    const userId = existing[0].id;

    await db
      .update(usersTable)
      .set({
        name: user.name,
        role: user.role,
        plan: user.plan ?? "FREE",
        emailVerified: true,
        updatedAt: new Date(),
      })
      .where(eq(usersTable.id, userId));

    const account = await db
      .select({ id: accountsTable.id })
      .from(accountsTable)
      .where(
        and(
          eq(accountsTable.userId, userId),
          eq(accountsTable.providerId, "CREDENTIALS"),
          eq(accountsTable.accountId, email),
        ),
      )
      .limit(1);

    if (account[0]) {
      await db
        .update(accountsTable)
        .set({
          passwordHash,
          updatedAt: new Date(),
        })
        .where(eq(accountsTable.id, account[0].id));
    } else {
      await db.insert(accountsTable).values({
        userId,
        providerId: "CREDENTIALS",
        accountId: email,
        passwordHash,
      });
    }

    return userId;
  }

  const inserted = await db
    .insert(usersTable)
    .values({
      name: user.name,
      email,
      emailVerified: true,
      role: user.role,
      plan: user.plan ?? "FREE",
    })
    .returning({ id: usersTable.id });

  const userId = inserted[0]!.id;

  await db.insert(accountsTable).values({
    userId,
    providerId: "CREDENTIALS",
    accountId: email,
    passwordHash,
  });

  return userId;
}

async function ensureForm(ownerId: string, form: SeedForm): Promise<string> {
  const existing = await db.select({ id: formsTable.id }).from(formsTable).where(eq(formsTable.slug, form.slug)).limit(1);

  if (existing[0]) {
    await db
      .update(formsTable)
      .set({
        ownerId,
        title: form.title,
        description: form.description,
        status: form.status,
        visibility: form.visibility,
        themeKey: form.themeKey,
        publishedAt: form.status === "PUBLISHED" ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(formsTable.id, existing[0].id));

    return existing[0].id;
  }

  const inserted = await db
    .insert(formsTable)
    .values({
      ownerId,
      title: form.title,
      description: form.description,
      slug: form.slug,
      status: form.status,
      visibility: form.visibility,
      themeKey: form.themeKey,
      publishedAt: form.status === "PUBLISHED" ? new Date() : null,
    })
    .returning({ id: formsTable.id });

  const formId = inserted[0]!.id;

  await db.insert(formPublicSettingsTable).values({ formId });

  return formId;
}

async function ensureFields(formId: string, fields: SeedField[]): Promise<Map<string, string>> {
  const existingFields = await db
    .select({ id: formFieldsTable.id, key: formFieldsTable.key })
    .from(formFieldsTable)
    .where(eq(formFieldsTable.formId, formId));

  const fieldIds = new Map(existingFields.map((field) => [field.key, field.id]));

  if (existingFields.length > 0) {
    return fieldIds;
  }

  const inserted = await db
    .insert(formFieldsTable)
    .values(
      fields.map((field, index) => ({
        formId,
        key: field.key,
        type: field.type,
        label: field.label,
        placeholder: field.placeholder ?? null,
        required: field.required ?? false,
        position: index,
        config: field.config ?? {},
      })),
    )
    .returning({ id: formFieldsTable.id, key: formFieldsTable.key });

  for (const field of inserted) {
    fieldIds.set(field.key, field.id);
  }

  return fieldIds;
}

async function ensureSampleResponses(
  formId: string,
  fieldIds: Map<string, string>,
  sampleResponses: Array<Record<string, unknown>> | undefined,
): Promise<void> {
  if (!sampleResponses?.length) return;

  const existingResponses = await db
    .select({ id: formResponsesTable.id })
    .from(formResponsesTable)
    .where(eq(formResponsesTable.formId, formId))
    .limit(1);

  if (existingResponses[0]) return;

  for (const sample of sampleResponses) {
    const emailValue = typeof sample.email_2 === "string" ? sample.email_2 : null;
    const nameValue = typeof sample.short_text_1 === "string" ? sample.short_text_1 : null;

    const [response] = await db
      .insert(formResponsesTable)
      .values({
        formId,
        respondentEmail: emailValue,
        respondentName: nameValue,
      })
      .returning({ id: formResponsesTable.id });

    const items = Object.entries(sample)
      .map(([fieldKey, value]) => {
        const fieldId = fieldIds.get(fieldKey);
        if (!fieldId) return null;
        return {
          responseId: response!.id,
          fieldId,
          fieldKey,
          value,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    if (items.length > 0) {
      await db.insert(formResponseItemsTable).values(items);
    }

    await db.insert(analyticsEventsTable).values([
      { formId, eventType: "VIEW", sessionKey: `seed-view-${response!.id}` },
      { formId, eventType: "START", sessionKey: `seed-start-${response!.id}` },
      { formId, responseId: response!.id, eventType: "SUBMIT", sessionKey: `seed-submit-${response!.id}` },
    ]);
  }
}

async function seed(): Promise<void> {
  console.log("Seeding database...\n");

  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);

  for (const user of seedUsers) {
    const userId = await ensureUser(user, passwordHash);
    console.log(`User ready: ${user.email} (${user.role})`);

    for (const form of user.forms) {
      const formId = await ensureForm(userId, form);
      const fieldIds = await ensureFields(formId, form.fields);
      await ensureSampleResponses(formId, fieldIds, form.sampleResponses);
      console.log(`  Form ready: ${form.title} [${form.status}] -> /f/${form.slug}`);
    }
  }

  console.log("\nSeed complete.\n");
  console.log("Demo credentials (all users share the same password):");
  console.log(`  Password: ${SEED_PASSWORD}`);
  for (const user of seedUsers) {
    const label = user.role === "ADMIN" ? "Admin" : "Creator";
    console.log(`  ${label}: ${user.email}`);
  }
}

seed()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await dbPool.end();
  });
