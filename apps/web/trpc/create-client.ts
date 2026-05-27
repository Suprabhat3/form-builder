import { httpLink, httpBatchStreamLink } from "@repo/trpc/client";
import { getApiBaseUrl, getApiUrl } from "~/lib/api-url";
import {
  clearAuthSession,
  getAccessToken,
  isAccessTokenUsable,
  refreshAuthSession,
} from "~/lib/auth-session";

interface CreateTRPCHttpBatchClientClientOpts {
  enableStreaming?: boolean;
}

export const createTRPCHttpBatchClientClient = (opts?: CreateTRPCHttpBatchClientClientOpts) => {
  const c = opts?.enableStreaming ? httpBatchStreamLink : httpLink;
  const apiUrl = getApiUrl();
  const apiBaseUrl = getApiBaseUrl();

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

      const refreshed = await refreshAuthSession(apiBaseUrl);
      const newAccessToken = refreshed?.accessToken ?? null;
      if (!newAccessToken) {
        if (!isAccessTokenUsable()) {
          clearAuthSession();
        }
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
