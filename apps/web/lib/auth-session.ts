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
};

export type PendingSignup = {
  name: string;
  email: string;
  password: string;
};

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
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
