import express, { type RequestHandler } from "express";
import { logger } from "@repo/logger";
import cors from "cors";

import * as trpcExpress from "@trpc/server/adapters/express";
import { generateOpenApiDocument, createOpenApiExpressMiddleware } from "trpc-to-openapi";

import { serverRouter, createContext } from "@repo/trpc/server";
import { authService } from "@repo/services/auth";
import { googleOAuth2Client } from "@repo/services/clients/google-oauth";
import { unlockProtectedFormBySlug } from "@repo/services/forms/access";

import { env } from "./env";

export const app = express();
const openApiDocument = generateOpenApiDocument(serverRouter, {
  title: "Streamyst OpenAPI",
  version: "1.0.0",
  baseUrl: env.BASE_URL.concat("/api"),
});

if (env.NODE_ENV !== "prod") {
  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
    }),
  );
}

app.use(express.json());

app.post("/forms/unlock", async (req, res) => {
  const slug = typeof req.body?.slug === "string" ? req.body.slug : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  if (!slug || !password) {
    return res.status(400).json({ success: false, message: "slug and password are required" });
  }

  const unlocked = await unlockProtectedFormBySlug(slug, password);
  if (!unlocked) {
    return res.status(404).json({ success: false, message: "Protected form not found" });
  }
  const cookieName = `form_unlock_${unlocked.formId}`;
  const secure = env.NODE_ENV === "prod";
  const parts = [
    `${cookieName}=1`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
  ];
  if (secure) parts.push("Secure");
  res.setHeader("Set-Cookie", parts.join("; "));
  return res.json({ success: true });
});

app.get("/", (req, res) => {
  return res.json({ message: "Streamyst is up and running..." });
});

app.get("/health", (req, res) => {
  return res.json({ message: "Streamyst server is healthy", healthy: true });
});

app.get("/auth/google/start", (req, res) => {
  const nextPath = typeof req.query.next === "string" ? req.query.next : "/";
  const authUrl = googleOAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["openid", "email", "profile"],
    prompt: "consent",
    state: Buffer.from(JSON.stringify({ next: nextPath })).toString("base64url"),
  });

  return res.redirect(authUrl);
});

app.get("/auth/google/callback", async (req, res) => {
  const code = req.query.code;
  const stateParam = typeof req.query.state === "string" ? req.query.state : "";
  let nextPath = "/";
  if (stateParam) {
    try {
      const parsed = JSON.parse(Buffer.from(stateParam, "base64url").toString("utf8")) as {
        next?: string;
      };
      if (parsed.next && parsed.next.startsWith("/")) {
        nextPath = parsed.next;
      }
    } catch {
      nextPath = "/";
    }
  }
  if (typeof code !== "string" || !code) {
    return res.redirect(`${env.FRONTEND_URL}/login?error=google_auth_failed&next=${encodeURIComponent(nextPath)}`);
  }

  try {
    const result = await authService.signInWithGoogleAuthCode(code);
    const authPayload = Buffer.from(JSON.stringify(result)).toString("base64url");
    return res.redirect(
      `${env.FRONTEND_URL}/login?auth=${encodeURIComponent(authPayload)}&next=${encodeURIComponent(nextPath)}`,
    );
  } catch (error) {
    logger.error("Google auth callback failed", { error });
    return res.redirect(`${env.FRONTEND_URL}/login?error=google_auth_failed&next=${encodeURIComponent(nextPath)}`);
  }
});

logger.debug(`openapi.json: ${env.BASE_URL}/openapi.json`);
app.get("/openapi.json", (req, res) => {
  return res.json(openApiDocument);
});

logger.debug(`docs: ${env.BASE_URL}/docs`);
// @scalar/express-api-reference is ESM-only; dynamic import works from the CJS bundle.
let scalarDocsMiddleware: RequestHandler | null = null;
app.use("/docs", async (req, res, next) => {
  try {
    if (!scalarDocsMiddleware) {
      const { apiReference } = await import("@scalar/express-api-reference");
      scalarDocsMiddleware = apiReference({ url: "/openapi.json" });
    }
    return scalarDocsMiddleware(req, res, next);
  } catch (error) {
    logger.error("Failed to load API docs middleware", { error });
    return res.status(500).json({ message: "API docs unavailable" });
  }
});

app.use(
  "/api",
  createOpenApiExpressMiddleware({
    router: serverRouter,
    createContext,
  }),
);

app.use(
  "/trpc",
  trpcExpress.createExpressMiddleware({
    router: serverRouter,
    createContext,
  }),
);

export default app;
