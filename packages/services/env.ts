import { z } from "zod";

const envSchema = z.object({
  JWT_ACCESS_SECRET: z.string().min(1),
  JWT_REFRESH_SECRET: z.string().min(1),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  RESEND_API_KEY: z.string().min(1),
  RESEND_FROM_EMAIL: z.string().email(),
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),
  TURNSTILE_SECRET_KEY: z.string().min(1).optional(),
  RATE_LIMIT_SALT: z.string().min(8).optional(),
  FORM_SUBMIT_RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().int().positive().default(60),
  FORM_SUBMIT_RATE_LIMIT_MAX_PER_IP_WINDOW: z.coerce.number().int().positive().default(20),
  FORM_SUBMIT_RATE_LIMIT_MAX_PER_IP_FORM_WINDOW: z.coerce.number().int().positive().default(5),
  GOOGLE_OAUTH_CLIENT_ID: z.string().optional(),
  GOOGLE_OAUTH_CLIENT_SECRET: z.string().optional(),
  GOOGLE_OAUTH_REDIRECT_URI: z.string().optional(),
});

function createEnv(env: NodeJS.ProcessEnv) {
  const safeParseResult = envSchema.safeParse(env);
  if (!safeParseResult.success) throw new Error(safeParseResult.error.message);
  return safeParseResult.data;
}

export const env = createEnv(process.env);
