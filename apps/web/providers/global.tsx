"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import React, { useEffect, useRef, useState } from "react";
import { Toaster } from "~/components/ui/sonner";
import { toast } from "sonner";

import { trpc } from "~/trpc/client";
import { createTRPCHttpBatchClientClient } from "~/trpc/create-client";
import { env } from "~/env.js";
import {
  clearAuthSession,
  getAccessTokenExpiryMs,
  getRefreshToken,
  refreshAuthSession,
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

    const apiUrl =
      env.NEXT_PUBLIC_API_URL ??
      (typeof window === "undefined"
        ? "http://localhost:8000/trpc"
        : `${window.location.protocol}//localhost:8000/trpc`);
    const apiBaseUrl = apiUrl.replace(/\/trpc\/?$/, "");

    const clearRefreshTimer = () => {
      if (refreshTimerRef.current) {
        window.clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };

    const scheduleRefresh = () => {
      clearRefreshTimer();
      const expiryMs = getAccessTokenExpiryMs();
      if (!expiryMs) return;
      const msUntilExpiry = expiryMs - Date.now();
      const refreshIn = Math.max(msUntilExpiry - 60_000, 30_000);
      refreshTimerRef.current = window.setTimeout(() => {
        void attemptRefresh("scheduled");
      }, refreshIn);
    };

    const attemptRefresh = async (source: "startup" | "focus" | "scheduled") => {
      const refreshToken = getRefreshToken();
      if (!refreshToken) return;

      const result = await refreshAuthSession(apiBaseUrl);
      if (!result && !toastGuardRef.current) {
        toastGuardRef.current = true;
        clearAuthSession();
        toast.error("Session expired. Please sign in again.");
      }

      if (result) {
        toastGuardRef.current = false;
        scheduleRefresh();
      }
    };

    const handleFocus = () => {
      if (document.visibilityState === "hidden") return;
      const expiryMs = getAccessTokenExpiryMs();
      if (!expiryMs) return;
      const msUntilExpiry = expiryMs - Date.now();
      if (msUntilExpiry < 120_000) {
        void attemptRefresh("focus");
      }
    };

    void attemptRefresh("startup");
    scheduleRefresh();
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    return () => {
      clearRefreshTimer();
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
