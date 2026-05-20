import express from "express";
import { logger } from "@repo/logger";
import cors from "cors";

import * as trpcExpress from "@trpc/server/adapters/express";
import { generateOpenApiDocument, createOpenApiExpressMiddleware } from "trpc-to-openapi";
import { apiReference } from "@scalar/express-api-reference";

import { serverRouter, createContext } from "@repo/trpc/server";
import { authService } from "@repo/services/auth";
import { googleOAuth2Client } from "@repo/services/clients/google-oauth";

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
app.use("/docs", apiReference({ url: "/openapi.json" }));

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
