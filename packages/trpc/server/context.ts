import { authService } from "@repo/services/auth";
import { IncomingHttpHeaders } from "http";

type CreateContextOptions = {
  req?: {
    headers: IncomingHttpHeaders;
    ip?: string;
    socket?: {
      remoteAddress?: string;
    };
  };
};

function firstHeaderValue(value: string | string[] | undefined): string | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function getClientIp(req: CreateContextOptions["req"]): string | null {
  if (!req) return null;
  const forwardedFor = firstHeaderValue(req.headers["x-forwarded-for"]);
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }
  const realIp = firstHeaderValue(req.headers["x-real-ip"]);
  if (realIp) return realIp.trim();
  if (req.ip) return req.ip;
  if (req.socket?.remoteAddress) return req.socket.remoteAddress;
  return null;
}

function parseCookieHeader(cookieHeader: string | string[] | undefined): Record<string, string> {
  const raw = Array.isArray(cookieHeader) ? cookieHeader.join(";") : cookieHeader;
  if (!raw) return {};
  const out: Record<string, string> = {};
  for (const part of raw.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (!k || rest.length === 0) continue;
    out[k] = decodeURIComponent(rest.join("="));
  }
  return out;
}

export async function createContext(opts: CreateContextOptions = {}) {
  const authorization = opts.req?.headers?.authorization;
  const token = typeof authorization === "string" && authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : null;
  const user = token && !isLikelyExpiredJwt(token) ? await authService.getCurrentUserFromToken(token) : null;

  return {
    user,
    headers: opts.req?.headers ?? {},
    clientIp: getClientIp(opts.req),
    cookies: parseCookieHeader(opts.req?.headers?.cookie),
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
