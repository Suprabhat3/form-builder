import { env } from "~/env.js";

export function getApiUrl(): string {
  if (env.NEXT_PUBLIC_API_URL) {
    return env.NEXT_PUBLIC_API_URL;
  }

  if (typeof window !== "undefined") {
    return `${window.location.origin}/trpc`;
  }

  return "http://localhost:8000/trpc";
}

export function getApiBaseUrl(): string {
  return getApiUrl().replace(/\/trpc\/?$/, "");
}
