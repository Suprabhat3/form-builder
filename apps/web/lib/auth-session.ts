const ACCESS_TOKEN_KEY = "auth.accessToken";
const REFRESH_TOKEN_KEY = "auth.refreshToken";
const USER_KEY = "auth.user";
const PENDING_SIGNUP_KEY = "auth.pendingSignup";
const AUTH_CHANGE_EVENT = "auth:changed";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  image: string | null;
  emailVerified: boolean;
  role?: "USER" | "ADMIN";
  plan?: "FREE" | "STARTER" | "PRO" | "BUSINESS";
  planExpiresAt?: string | null;
  maxForms?: number;
};

export type PendingSignup = {
  name: string;
  email: string;
  password: string;
};

export type AuthSessionPayload = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

function readStoredAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getAccessToken(): string | null {
  const token = readStoredAccessToken();
  if (!token) return null;

  const expiryMs = getJwtExpiryMs(token);
  if (expiryMs && expiryMs <= Date.now()) {
    return null;
  }

  return token;
}

export function getStoredAccessTokenExpiryMs(): number | null {
  const token = readStoredAccessToken();
  if (!token) return null;
  return getJwtExpiryMs(token);
}

export function isAccessTokenUsable(): boolean {
  const token = readStoredAccessToken();
  if (!token) return false;

  const expiryMs = getJwtExpiryMs(token);
  if (!expiryMs) return true;
  return expiryMs > Date.now();
}

export function shouldRefreshAccessToken(thresholdMs = 120_000): boolean {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  if (!isAccessTokenUsable()) return true;

  const expiryMs = getStoredAccessTokenExpiryMs();
  if (!expiryMs) return false;
  return expiryMs - Date.now() < thresholdMs;
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getAuthUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setAuthSession(payload: {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACCESS_TOKEN_KEY, payload.accessToken);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, payload.refreshToken);
  window.localStorage.setItem(USER_KEY, JSON.stringify(payload.user));
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

function decodeAuthCallbackPayload(authParam: string): AuthSessionPayload {
  const normalized = authParam.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const decoded = JSON.parse(
    new TextDecoder().decode(Uint8Array.from(atob(padded), (c) => c.charCodeAt(0))),
  ) as AuthSessionPayload;

  if (!decoded?.accessToken || !decoded?.refreshToken || !decoded?.user?.id) {
    throw new Error("Incomplete auth payload");
  }

  return decoded;
}

export function consumeAuthCallbackFromUrl(): { session: AuthSessionPayload; nextPath: string | null } | null {
  if (typeof window === "undefined") return null;

  const url = new URL(window.location.href);
  const auth = url.searchParams.get("auth");
  if (!auth) return null;

  try {
    const session = decodeAuthCallbackPayload(auth);
    setAuthSession(session);

    const nextParam = url.searchParams.get("next");
    const nextPath = nextParam && nextParam.startsWith("/") ? nextParam : null;

    url.searchParams.delete("auth");
    if (nextParam) url.searchParams.delete("next");
    window.history.replaceState({}, "", url.toString());

    return { session, nextPath };
  } catch {
    return null;
  }
}

function getJwtExpiryMs(token: string): number | null {
  try {
    const parts = token.split(".");
    const payload = parts[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const decoded = JSON.parse(
      new TextDecoder().decode(Uint8Array.from(atob(padded), (c) => c.charCodeAt(0))),
    ) as { exp?: number };
    if (typeof decoded.exp !== "number") return null;
    return decoded.exp * 1000;
  } catch {
    return null;
  }
}

export function getAccessTokenExpiryMs(): number | null {
  return getStoredAccessTokenExpiryMs();
}

let refreshSessionPromise: Promise<AuthSessionPayload | null> | null = null;

export async function refreshAuthSession(apiBaseUrl: string): Promise<AuthSessionPayload | null> {
  if (typeof window === "undefined") return null;

  if (refreshSessionPromise) {
    return refreshSessionPromise;
  }

  refreshSessionPromise = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return null;

    try {
      const response = await fetch(`${apiBaseUrl}/api/authentication/refresh`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) return null;

      const data = (await response.json()) as AuthSessionPayload;
      if (!data?.accessToken || !data?.refreshToken || !data?.user) return null;

      setAuthSession(data);
      return data;
    } catch {
      return null;
    } finally {
      refreshSessionPromise = null;
    }
  })();

  return refreshSessionPromise;
}

export function clearAuthSession(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

export function setPendingSignup(payload: PendingSignup): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(PENDING_SIGNUP_KEY, JSON.stringify(payload));
}

export function getPendingSignup(): PendingSignup | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(PENDING_SIGNUP_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PendingSignup;
  } catch {
    return null;
  }
}

export function clearPendingSignup(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(PENDING_SIGNUP_KEY);
}

export function onAuthChange(handler: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(AUTH_CHANGE_EVENT, handler);
  window.addEventListener("storage", handler);

  return () => {
    window.removeEventListener(AUTH_CHANGE_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}
