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
  const user = token ? await authService.getCurrentUserFromToken(token) : null;

  return {
    user,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
