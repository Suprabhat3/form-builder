import { db, eq, and, gt, sql } from "@repo/database";
import { usersTable, accountsTable, verificationTable } from "@repo/database/schema";
import { logger } from "@repo/logger";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import { googleOAuth2Client } from "../clients/google-oauth";
import { env } from "../env";
import { sendEmailVerificationCode } from "./email-verification";

const EMAIL_VERIFICATION_TTL_MS = 10 * 60 * 1000;
let verificationStorageReady: Promise<void> | null = null;

type JwtPayload = {
  sub: string;
  email: string;
};

type AuthUser = {
  id: string;
  email: string;
  name: string;
  image: string | null;
  emailVerified: boolean;
};

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function createSixDigitOtp(): string {
  return String(crypto.randomInt(0, 1000000)).padStart(6, "0");
}

async function ensureVerificationStorage(): Promise<void> {
  if (!verificationStorageReady) {
    verificationStorageReady = (async () => {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS "verification" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          "identifier" varchar(255) NOT NULL,
          "value" text NOT NULL,
          "expires_at" timestamp with time zone NOT NULL,
          "created_at" timestamp with time zone DEFAULT now() NOT NULL,
          "updated_at" timestamp with time zone DEFAULT now() NOT NULL
        );
      `);

      await db.execute(sql`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);
      await db.execute(sql`ALTER TABLE "verification" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid();`);
      await db.execute(sql`ALTER TABLE "verification" ADD COLUMN IF NOT EXISTS "identifier" varchar(255);`);
      await db.execute(sql`ALTER TABLE "verification" ADD COLUMN IF NOT EXISTS "value" text;`);
      await db.execute(
        sql`ALTER TABLE "verification" ADD COLUMN IF NOT EXISTS "expires_at" timestamp with time zone;`,
      );
      await db.execute(
        sql`ALTER TABLE "verification" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now();`,
      );
      await db.execute(
        sql`ALTER TABLE "verification" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now();`,
      );
    })();
  }

  await verificationStorageReady;
}

function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"],
  });
}

function signRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions["expiresIn"],
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
}

async function upsertEmailVerificationToken(email: string, otp: string): Promise<void> {
  await ensureVerificationStorage();

  const identifier = `email-verification:${email.toLowerCase()}`;
  const codeHash = sha256(otp);
  const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS);

  const existing = await db
    .select({ identifier: verificationTable.identifier })
    .from(verificationTable)
    .where(eq(verificationTable.identifier, identifier))
    .limit(1);

  if (existing[0]?.identifier) {
    await db
      .update(verificationTable)
      .set({
        value: codeHash,
        expiresAt,
        updatedAt: new Date(),
      })
      .where(eq(verificationTable.identifier, identifier));
    return;
  }

  await db.insert(verificationTable).values({
    identifier,
    value: codeHash,
    expiresAt,
  });
}

async function consumeEmailVerificationToken(email: string, otp: string): Promise<boolean> {
  await ensureVerificationStorage();

  const identifier = `email-verification:${email.toLowerCase()}`;
  const codeHash = sha256(otp);
  const now = new Date();

  const row = await db
    .select({
      identifier: verificationTable.identifier,
      value: verificationTable.value,
      expiresAt: verificationTable.expiresAt,
    })
    .from(verificationTable)
    .where(and(eq(verificationTable.identifier, identifier), gt(verificationTable.expiresAt, now)))
    .limit(1);

  if (!row[0] || row[0].value !== codeHash) {
    return false;
  }

  await db
    .delete(verificationTable)
    .where(and(eq(verificationTable.identifier, identifier), eq(verificationTable.value, codeHash)));
  return true;
}

async function findUserByEmail(email: string): Promise<AuthUser | null> {
  const user = await db
    .select({
      id: usersTable.id,
      email: usersTable.email,
      name: usersTable.name,
      image: usersTable.image,
      emailVerified: usersTable.emailVerified,
    })
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase()))
    .limit(1);

  return user[0] ?? null;
}

export class AuthService {
  public async sendEmailVerificationOtp(email: string): Promise<void> {
    const normalizedEmail = email.toLowerCase();
    const otp = createSixDigitOtp();
    await upsertEmailVerificationToken(normalizedEmail, otp);
    await sendEmailVerificationCode({ email: normalizedEmail, otp });
  }

  public async verifyEmailOtp(email: string, otp: string): Promise<void> {
    const isValid = await consumeEmailVerificationToken(email.toLowerCase(), otp);
    if (!isValid) throw new Error("Invalid or expired verification code");
  }

  public async signUpWithEmail(input: {
    name: string;
    email: string;
    password: string;
    otp: string;
  }): Promise<{ accessToken: string; refreshToken: string; user: AuthUser }> {
    const normalizedEmail = input.email.toLowerCase();
    const isValidOtp = await consumeEmailVerificationToken(normalizedEmail, input.otp);
    if (!isValidOtp) throw new Error("Invalid or expired verification code");

    const existingUser = await findUserByEmail(normalizedEmail);
    if (existingUser) throw new Error("User already exists with this email");

    const passwordHash = await bcrypt.hash(input.password, 10);

    const insertedUsers = await db
      .insert(usersTable)
      .values({
        name: input.name,
        email: normalizedEmail,
        emailVerified: true,
      })
      .returning({
        id: usersTable.id,
        email: usersTable.email,
        name: usersTable.name,
        image: usersTable.image,
        emailVerified: usersTable.emailVerified,
      });

    const user = insertedUsers[0]!;

    await db.insert(accountsTable).values({
      userId: user.id,
      providerId: "CREDENTIALS",
      accountId: user.email,
      passwordHash,
    });

    const payload: JwtPayload = { sub: user.id, email: user.email };
    return {
      accessToken: signAccessToken(payload),
      refreshToken: signRefreshToken(payload),
      user,
    };
  }

  public async signInWithEmail(input: {
    email: string;
    password: string;
  }): Promise<{ accessToken: string; refreshToken: string; user: AuthUser }> {
    const normalizedEmail = input.email.toLowerCase();
    const user = await findUserByEmail(normalizedEmail);
    if (!user) throw new Error("Invalid credentials");

    const account = await db
      .select({
        passwordHash: accountsTable.passwordHash,
      })
      .from(accountsTable)
      .where(
        and(eq(accountsTable.userId, user.id), eq(accountsTable.providerId, "CREDENTIALS"), eq(accountsTable.accountId, user.email)),
      )
      .limit(1);

    const hash = account[0]?.passwordHash;
    if (!hash) throw new Error("Invalid credentials");

    const isMatch = await bcrypt.compare(input.password, hash);
    if (!isMatch) throw new Error("Invalid credentials");

    if (!user.emailVerified) throw new Error("Email is not verified");

    const payload: JwtPayload = { sub: user.id, email: user.email };
    return {
      accessToken: signAccessToken(payload),
      refreshToken: signRefreshToken(payload),
      user,
    };
  }

  public async signInWithGoogleAuthCode(code: string): Promise<{
    accessToken: string;
    refreshToken: string;
    user: AuthUser;
  }> {
    const tokenResponse = await googleOAuth2Client.getToken(code);
    const idToken = tokenResponse.tokens.id_token;
    if (!idToken) throw new Error("Google ID token not found");

    const ticket = await googleOAuth2Client.verifyIdToken({
      idToken,
      audience: env.GOOGLE_OAUTH_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.email) throw new Error("Google account email not available");

    const normalizedEmail = payload.email.toLowerCase();
    let user = await findUserByEmail(normalizedEmail);

    if (!user) {
      const inserted = await db
        .insert(usersTable)
        .values({
          name: payload.name ?? normalizedEmail.split("@")[0] ?? "User",
          email: normalizedEmail,
          image: payload.picture ?? null,
          emailVerified: payload.email_verified ?? true,
        })
        .returning({
          id: usersTable.id,
          email: usersTable.email,
          name: usersTable.name,
          image: usersTable.image,
          emailVerified: usersTable.emailVerified,
        });
      user = inserted[0]!;
    }

    const account = await db
      .select({ id: accountsTable.id })
      .from(accountsTable)
      .where(and(eq(accountsTable.userId, user.id), eq(accountsTable.providerId, "GOOGLE_OAUTH")))
      .limit(1);

    if (!account[0]) {
      await db.insert(accountsTable).values({
        userId: user.id,
        providerId: "GOOGLE_OAUTH",
        accountId: payload.sub ?? normalizedEmail,
      });
    }

    const jwtPayload: JwtPayload = { sub: user.id, email: user.email };
    return {
      accessToken: signAccessToken(jwtPayload),
      refreshToken: signRefreshToken(jwtPayload),
      user,
    };
  }

  public async getCurrentUserFromToken(token: string): Promise<AuthUser | null> {
    try {
      const payload = verifyAccessToken(token);
      const user = await db
        .select({
          id: usersTable.id,
          email: usersTable.email,
          name: usersTable.name,
          image: usersTable.image,
          emailVerified: usersTable.emailVerified,
        })
        .from(usersTable)
        .where(eq(usersTable.id, payload.sub))
        .limit(1);
      return user[0] ?? null;
    } catch (error) {
      logger.warn("Invalid access token", { error });
      return null;
    }
  }
}

export const authService = new AuthService();
