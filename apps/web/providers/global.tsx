"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import React, { useEffect, useRef, useState } from "react";
import { Toaster } from "~/components/ui/sonner";
import { toast } from "sonner";

import { trpc } from "~/trpc/client";
import { createTRPCHttpBatchClientClient } from "~/trpc/create-client";
import { getApiBaseUrl } from "~/lib/api-url";
import {
  clearAuthSession,
  consumeAuthCallbackFromUrl,
  getAccessTokenExpiryMs,
  getRefreshToken,
  isAccessTokenUsable,
  onAuthChange,
  refreshAuthSession,
  shouldRefreshAccessToken,
} from "~/lib/auth-session";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnMount: true,
      staleTime: Infinity,
    },
  },
});

export const GlobalProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [createTRPCHttpBatchClientClient()],
    }),
  );
  const refreshTimerRef = useRef<number | null>(null);
  const toastGuardRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const apiBaseUrl = getApiBaseUrl();

    const clearRefreshTimer = () => {
      if (refreshTimerRef.current) {
        window.clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };

    const scheduleRefresh = () => {
      clearRefreshTimer();
      const expiryMs = getAccessTokenExpiryMs();
      if (!expiryMs || !getRefreshToken()) return;

      const msUntilExpiry = expiryMs - Date.now();
      const refreshIn = Math.max(msUntilExpiry - 60_000, 30_000);
      refreshTimerRef.current = window.setTimeout(() => {
        void attemptRefresh("scheduled");
      }, refreshIn);
    };

    const attemptRefresh = async (source: "focus" | "scheduled") => {
      if (!getRefreshToken()) {
        clearRefreshTimer();
        return;
      }

      if (source === "focus" && !shouldRefreshAccessToken()) {
        return;
      }

      const hadUsableSession = isAccessTokenUsable();
      const result = await refreshAuthSession(apiBaseUrl);

      if (!result) {
        if (isAccessTokenUsable()) {
          scheduleRefresh();
          return;
        }

        clearAuthSession();

        if (hadUsableSession && !toastGuardRef.current) {
          toastGuardRef.current = true;
          toast.error("Session expired. Please sign in again.");
        }
        return;
      }

      toastGuardRef.current = false;
      scheduleRefresh();
    };

    const initSession = async () => {
      // Process Google OAuth callback before any refresh logic (AuthForm may still be in Suspense).
      const oauthCallback = consumeAuthCallbackFromUrl();
      if (oauthCallback) {
        toast.success("Signed in with Google");
        toastGuardRef.current = false;
        scheduleRefresh();
        if (oauthCallback.nextPath) {
          window.location.assign(oauthCallback.nextPath);
        }
        return;
      }

      if (!getRefreshToken()) return;

      if (isAccessTokenUsable()) {
        scheduleRefresh();
        return;
      }

      // Silently recover or clear stale sessions — never toast on initial page load.
      const result = await refreshAuthSession(apiBaseUrl);
      if (result) {
        scheduleRefresh();
        return;
      }

      clearAuthSession();
    };

    const handleFocus = () => {
      if (document.visibilityState === "hidden") return;
      if (shouldRefreshAccessToken()) {
        void attemptRefresh("focus");
      }
    };

    void initSession();

    const unsubscribeAuth = onAuthChange(() => {
      toastGuardRef.current = false;
      scheduleRefresh();
    });

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    return () => {
      clearRefreshTimer();
      unsubscribeAuth();
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <NextThemesProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        <trpc.Provider queryClient={queryClient} client={trpcClient}>
          {children}
          <Toaster />
        </trpc.Provider>
      </NextThemesProvider>
    </QueryClientProvider>
  );
};
