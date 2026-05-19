import { httpLink, httpBatchStreamLink } from "@repo/trpc/client";
import { env } from "~/env.js";
import { getAccessToken } from "~/lib/auth-session";

interface CreateTRPCHttpBatchClientClientOpts {
  enableStreaming?: boolean;
}

export const createTRPCHttpBatchClientClient = (opts?: CreateTRPCHttpBatchClientClientOpts) => {
  const c = opts?.enableStreaming ? httpBatchStreamLink : httpLink;
  const apiUrl =
    env.NEXT_PUBLIC_API_URL ??
    (typeof window === "undefined" ? "http://localhost:8000/trpc" : `${window.location.protocol}//localhost:8000/trpc`);

  return c({
    url: apiUrl,
    headers() {
      const accessToken = getAccessToken();
      return accessToken ? { authorization: `Bearer ${accessToken}` } : {};
    },
    fetch(url, options) {
      return fetch(url, {
        ...options,
        credentials: "include",
      });
    },
  });
};
