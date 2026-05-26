import { createHash } from "crypto";
import { db, eq } from "@repo/database";
import { formPublicSettingsTable, formsTable } from "@repo/database/schema";
import { env } from "../env";

function hashFormPassword(password: string): string {
  const salt = env.RATE_LIMIT_SALT ?? env.JWT_ACCESS_SECRET;
  return createHash("sha256").update(`form-password:${salt}:${password}`).digest("hex");
}

export async function unlockProtectedFormBySlug(slug: string, password: string): Promise<{ formId: string } | null> {
  const rows = await db
    .select({
      formId: formsTable.id,
      passwordHash: formPublicSettingsTable.passwordHash,
    })
    .from(formsTable)
    .leftJoin(formPublicSettingsTable, eq(formPublicSettingsTable.formId, formsTable.id))
    .where(eq(formsTable.slug, slug))
    .limit(1);

  const form = rows[0];
  if (!form || !form.passwordHash) return null;

  const candidateHash = hashFormPassword(password);
  if (candidateHash !== form.passwordHash) return null;

  return { formId: form.formId };
}

