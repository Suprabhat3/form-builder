import { authService } from "@repo/services/auth";
import { IncomingHttpHeaders } from "http";

type CreateContextOptions = {
  req?: {
    headers: IncomingHttpHeaders;
  };
};

export async function createContext(opts: CreateContextOptions = {}) {
  const authorization = opts.req?.headers?.authorization;
  const token = typeof authorization === "string" && authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : null;
  const user = token && !isLikelyExpiredJwt(token) ? await authService.getCurrentUserFromToken(token) : null;

  return {
    user,
  };
}

function isLikelyExpiredJwt(token: string): boolean {
  try {
    const parts = token.split(".");
    const payload = parts[1];
    if (!payload) return false;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const decoded = JSON.parse(Buffer.from(padded, "base64").toString("utf8")) as { exp?: number };
    if (typeof decoded.exp !== "number") return false;
    return decoded.exp * 1000 <= Date.now();
  } catch {
    return false;
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>;
