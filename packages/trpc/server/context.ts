import { auth } from "@repo/services/auth";
import { IncomingHttpHeaders } from "http";

function toHeaders(headers: IncomingHttpHeaders): Headers {
  const result = new Headers();
  for (const [key, value] of Object.entries(headers)) {
    if (typeof value === "string") {
      result.set(key, value);
      continue;
    }
    if (Array.isArray(value)) {
      for (const item of value) result.append(key, item);
    }
  }
  return result;
}

type CreateContextOptions = {
  req?: {
    headers: IncomingHttpHeaders;
  };
};

export async function createContext(opts: CreateContextOptions = {}) {
  const headers = opts.req?.headers ? toHeaders(opts.req.headers) : new Headers();
  const session = await auth.api.getSession({ headers });

  return {
    session,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
