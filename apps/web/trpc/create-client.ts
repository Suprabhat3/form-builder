import { httpLink, httpBatchStreamLink } from "@repo/trpc/client";
import { env } from "~/env.js";
import { clearAuthSession, getAccessToken, refreshAuthSession } from "~/lib/auth-session";

interface CreateTRPCHttpBatchClientClientOpts {
  enableStreaming?: boolean;
}

export const createTRPCHttpBatchClientClient = (opts?: CreateTRPCHttpBatchClientClientOpts) => {
  const c = opts?.enableStreaming ? httpBatchStreamLink : httpLink;
  const apiUrl =
    env.NEXT_PUBLIC_API_URL ??
    (typeof window === "undefined" ? "http://localhost:8000/trpc" : `${window.location.protocol}//localhost:8000/trpc`);
  const apiBaseUrl = apiUrl.replace(/\/trpc\/?$/, "");

  let refreshPromise: Promise<string | null> | null = null;

  const buildAuthHeaders = (): Record<string, string> => {
    const accessToken = getAccessToken();
    if (!accessToken) return {};
    return { authorization: `Bearer ${accessToken}` };
  };

  const normalizeHeaders = (headers?: HeadersInit): Record<string, string> => {
    const normalized: Record<string, string> = {};
    if (!headers) return normalized;
    if (headers instanceof Headers) {
      headers.forEach((value, key) => {
        normalized[key] = value;
      });
      return normalized;
    }
    if (Array.isArray(headers)) {
      for (const [key, value] of headers) {
        if (typeof value === "string") {
          normalized[key] = value;
        }
      }
      return normalized;
    }
    for (const [key, value] of Object.entries(headers)) {
      if (typeof value === "string") {
        normalized[key] = value;
      }
    }
    return normalized;
  };

  const refreshAccessToken = async (): Promise<string | null> => {
    if (refreshPromise) return refreshPromise;
    refreshPromise = (async () => {
      try {
        const refreshed = await refreshAuthSession(apiBaseUrl);
        return refreshed?.accessToken ?? null;
      } finally {
        refreshPromise = null;
      }
    })();

    return refreshPromise;
  };

  return c({
    url: apiUrl,
    headers() {
      return buildAuthHeaders();
    },
    async fetch(url, options) {
      const response = await fetch(url, {
        ...options,
        credentials: "include",
      });

      if (response.status !== 401 || typeof window === "undefined") {
        return response;
      }

      if (url.toString().includes("/authentication/refresh")) {
        return response;
      }

      const newAccessToken = await refreshAccessToken();
      if (!newAccessToken) {
        clearAuthSession();
        return response;
      }

      const nextHeaders = {
        ...normalizeHeaders(options?.headers),
        ...buildAuthHeaders(),
      };

      return fetch(url, {
        ...options,
        headers: nextHeaders,
        credentials: "include",
      });
    },
  });
};
