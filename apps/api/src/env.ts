import { z } from "zod";

const envSchema = z.object({
  PORT: z.string().optional(),
  // Railway/Vercel set NODE_ENV=production; normalize to "prod" for app logic.
  NODE_ENV: z.preprocess(
    (value) => (value === "production" ? "prod" : value),
    z.enum(["development", "prod"]).default("development"),
  ),
  BASE_URL: z.string().default("http://localhost:8000"),
  FRONTEND_URL: z.string().default("http://localhost:3000"),
});

function createEnv(env: NodeJS.ProcessEnv) {
  const safeParseResult = envSchema.safeParse(env);
  if (!safeParseResult.success) throw new Error(safeParseResult.error.message);
  return safeParseResult.data;
}

export const env = createEnv(process.env);
