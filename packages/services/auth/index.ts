import { db } from "@repo/database";
import { accountsTable, sessionsTable, usersTable, verificationTable } from "@repo/database/schema";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { env } from "../env";

const hasGoogleOAuth =
  !!env.GOOGLE_OAUTH_CLIENT_ID && !!env.GOOGLE_OAUTH_CLIENT_SECRET && !!env.GOOGLE_OAUTH_REDIRECT_URI;

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: usersTable,
      session: sessionsTable,
      account: accountsTable,
      verification: verificationTable,
    },
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  socialProviders: hasGoogleOAuth
    ? {
        google: {
          clientId: env.GOOGLE_OAUTH_CLIENT_ID!,
          clientSecret: env.GOOGLE_OAUTH_CLIENT_SECRET!,
          redirectURI: env.GOOGLE_OAUTH_REDIRECT_URI!,
        },
      }
    : {},
});
