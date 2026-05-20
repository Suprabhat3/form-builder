"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { trpc } from "~/trpc/client";
import { clearAuthSession, getAuthUser, getRefreshToken, onAuthChange, type AuthUser } from "~/lib/auth-session";

export function TopNavBar() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const signOutMutation = trpc.auth.signOut.useMutation();

  useEffect(() => {
    const sync = () => setAuthUser(getAuthUser());
    sync();
    return onAuthChange(sync);
  }, []);

  return (
    <nav className="bg-surface/80 dark:bg-surface/80 backdrop-blur-xl border-b border-outline-variant/30 dark:border-outline/20 shadow-sm dark:shadow-none docked full-width top-0 sticky z-50">
      <div className="flex justify-between items-center w-full px-margin py-4 max-w-7xl mx-auto">
        <Link
          className="text-headline-md font-headline-md md:text-headline-md md:font-headline-md font-bold tracking-tight text-on-surface dark:text-on-surface flex items-center gap-xs hover:opacity-80 transition-opacity"
          href="/"
        >
          <Image src="/logo.png" alt="Logo" width={32} height={32} className="rounded-full" />
          ZenForm
        </Link>
        <div className="hidden md:flex items-center gap-lg">
          <Link
            className="text-label-md font-label-md text-on-surface-variant hover:text-primary transition-colors"
            href="#"
          >
            Marketplace
          </Link>
          <Link
            className="text-label-md font-label-md text-on-surface-variant hover:text-primary transition-colors"
            href="#"
          >
            Features
          </Link>
          <Link
            className="text-label-md font-label-md text-on-surface-variant hover:text-primary transition-colors"
            href="#"
          >
            Templates
          </Link>
          <Link
            className="text-label-md font-label-md text-on-surface-variant hover:text-primary transition-colors"
            href="#"
          >
            Pricing
          </Link>
        </div>
        <div className="flex items-center gap-md">
          {authUser ? (
            <>
              <span className="hidden md:block text-label-md font-label-md text-on-surface-variant">
                {authUser.name}
              </span>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const refreshToken = getRefreshToken();
                    if (refreshToken) {
                      await signOutMutation.mutateAsync({ refreshToken });
                    }
                  } finally {
                    clearAuthSession();
                  }
                }}
                className="text-label-md font-label-md text-on-surface-variant hover:text-primary transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                className="hidden md:block text-label-md font-label-md text-on-surface-variant hover:text-primary transition-colors"
                href="/login"
              >
                Sign In
              </Link>
              <Link
                className="text-label-md font-label-md bg-gradient-to-r from-primary to-primary-container text-on-primary px-md py-xs rounded-full hover:shadow-md hover:opacity-95 transition-all scale-95 duration-150 ease-in-out"
                href="/signup"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
