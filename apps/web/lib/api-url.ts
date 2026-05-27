import { env } from "~/env.js";

function ensureTrpcPath(url: string): string {
  const trimmed = url.replace(/\/+$/, "");
  return trimmed.endsWith("/trpc") ? trimmed : `${trimmed}/trpc`;
}

export function getApiUrl(): string {
  const configured = env.NEXT_PUBLIC_API_URL;
  if (configured) {
    return ensureTrpcPath(configured);
  }

  if (typeof window !== "undefined") {
    return `${window.location.origin}/trpc`;
  }

  return "http://localhost:8000/trpc";
}

export function getApiBaseUrl(): string {
  const apiUrl = getApiUrl();
  if (apiUrl.startsWith("/")) {
    return "";
  }

  return apiUrl.replace(/\/trpc\/?$/, "");
}
