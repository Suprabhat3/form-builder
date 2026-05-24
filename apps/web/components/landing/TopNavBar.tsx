"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { trpc } from "~/trpc/client";
import {
  clearAuthSession,
  getAuthUser,
  getRefreshToken,
  onAuthChange,
  type AuthUser,
} from "~/lib/auth-session";

const NAV_LINKS = [
  { label: "Explore", href: "/explore" },
  { label: "Features", href: "#features" },
  { label: "Templates", href: "/templates" },
  { label: "Pricing", href: "#pricing" },
];

export function TopNavBar() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const signOutMutation = trpc.auth.signOut.useMutation();

  const navRef = useRef<HTMLElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sync = () => setAuthUser(getAuthUser());
    sync();
    return onAuthChange(sync);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on outside click
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [mobileMenuOpen]);

  // Close user dropdown on outside click
  useEffect(() => {
    if (!userMenuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [userMenuOpen]);

  const handleSignOut = async () => {
    try {
      const refreshToken = getRefreshToken();
      if (refreshToken) await signOutMutation.mutateAsync({ refreshToken });
    } finally {
      clearAuthSession();
      setMobileMenuOpen(false);
      setUserMenuOpen(false);
    }
  };

  return (
    <header className="docked full-width top-0 sticky z-50 flex justify-center px-4 pt-3 pb-1 pointer-events-none">
      {/* ── Floating pill container ── */}
      <nav
        ref={navRef}
        className={[
          "pointer-events-auto w-full max-w-6xl rounded-2xl transition-all duration-300",
          scrolled
            ? "bg-surface/85 dark:bg-surface-container/85 backdrop-blur-2xl shadow-[0_4px_32px_-4px_rgba(0,0,0,0.18)] border border-outline-variant/25 dark:border-outline/15"
            : "bg-surface/60 dark:bg-surface-container/50 backdrop-blur-xl border border-outline-variant/15 dark:border-outline/10",
        ].join(" ")}
      >
        <div className="flex items-center justify-between px-5 h-14">
          {/* ── Brand ── */}
          <Link href="/" className="flex items-center gap-2 group select-none">
            <span className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-primary/10 ring-1 ring-primary/20 group-hover:ring-primary/40 transition-all duration-200">
              <Image src="/logo.png" alt="ZenForm logo" width={22} height={22} className="rounded-lg" />
            </span>
            <span className="text-[1.05rem] font-bold tracking-tight text-on-surface group-hover:text-primary transition-colors duration-200">
              ZenForm
            </span>
          </Link>

          {/* ── Desktop nav links ── */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="relative px-3.5 py-1.5 text-sm font-medium text-on-surface-variant hover:text-on-surface rounded-lg hover:bg-surface-container-low/70 transition-all duration-150 group"
              >
                <span className="relative z-10">{label}</span>
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-0.5 w-0 group-hover:w-5 rounded-full bg-primary transition-all duration-200" />
              </Link>
            ))}
          </div>

          {/* ── Desktop auth controls ── */}
          <div className="hidden md:flex items-center gap-2">
            {authUser ? (
              /* ── User avatar + dropdown ── */
              <div ref={userMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((v) => !v)}
                  aria-expanded={userMenuOpen}
                  aria-label="User menu"
                  className={[
                    "flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-xl border transition-all duration-200 select-none",
                    userMenuOpen
                      ? "bg-surface-container border-outline-variant/40 shadow-sm"
                      : "border-transparent hover:bg-surface-container-low/60 hover:border-outline-variant/25",
                  ].join(" ")}
                >
                  {/* Avatar circle */}
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/15 ring-1 ring-primary/30 shrink-0">
                    <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                    </svg>
                  </span>
                  <span className="text-sm font-semibold text-on-surface leading-none">
                    {authUser.name}
                  </span>
                  {/* Chevron */}
                  <svg
                    className={[
                      "w-3.5 h-3.5 text-on-surface-variant transition-transform duration-200",
                      userMenuOpen ? "rotate-180" : "",
                    ].join(" ")}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>

                {/* ── Dropdown panel ── */}
                <div
                  className={[
                    "absolute right-0 top-[calc(100%+8px)] w-52 rounded-2xl border border-outline-variant/25 bg-surface/95 dark:bg-surface-container/95 backdrop-blur-xl shadow-[0_8px_32px_-4px_rgba(0,0,0,0.18)] p-1.5 flex flex-col gap-0.5 origin-top-right transition-all duration-200",
                    userMenuOpen
                      ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                      : "opacity-0 scale-95 -translate-y-1 pointer-events-none",
                  ].join(" ")}
                >
                  {/* User info header */}
                  <div className="px-3 py-2.5 border-b border-outline-variant/20 mb-1">
                    <p className="text-xs text-on-surface-variant">Signed in as</p>
                    <p className="text-sm font-bold text-on-surface truncate">{authUser.name}</p>
                  </div>

                  {/* Dashboard */}
                  <Link
                    href="/dashboard"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-on-surface hover:bg-primary/8 hover:text-primary transition-all duration-150 group"
                  >
                    <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-surface-container-low group-hover:bg-primary/12 transition-colors duration-150">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="7" height="7" rx="1.5" />
                        <rect x="14" y="3" width="7" height="7" rx="1.5" />
                        <rect x="3" y="14" width="7" height="7" rx="1.5" />
                        <rect x="14" y="14" width="7" height="7" rx="1.5" />
                      </svg>
                    </span>
                    Dashboard
                  </Link>

                  {/* Divider */}
                  <div className="h-px bg-outline-variant/20 my-0.5" />

                  {/* Logout */}
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-on-surface-variant hover:bg-error/8 hover:text-error transition-all duration-150 group w-full text-left"
                  >
                    <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-surface-container-low group-hover:bg-error/12 transition-colors duration-150">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                    </span>
                    Log out
                  </button>
                </div>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-1.5 text-sm font-medium text-on-surface-variant hover:text-on-surface rounded-lg hover:bg-surface-container-low/70 transition-all duration-150"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="relative px-5 py-2 text-sm font-semibold text-on-primary rounded-xl overflow-hidden group"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 70%, var(--color-secondary)))",
                  }}
                >
                  <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/10 rounded-xl" />
                  <span className="relative">Get Started →</span>
                </Link>
              </>
            )}
          </div>

          {/* ── Mobile: CTA + hamburger ── */}
          <div className="flex md:hidden items-center gap-2">
            {authUser ? (
              <Link
                href="/dashboard"
                className="px-3 py-1.5 text-xs font-semibold bg-primary text-on-primary rounded-lg hover:opacity-90 transition-all"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/signup"
                className="px-3 py-1.5 text-xs font-semibold bg-primary text-on-primary rounded-lg hover:opacity-90 transition-all"
              >
                Get Started
              </Link>
            )}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
              className="flex items-center justify-center w-9 h-9 rounded-xl border border-outline-variant/30 bg-surface-container-lowest/80 text-on-surface hover:border-primary/30 hover:text-primary transition-all duration-200"
            >
              <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* ── Mobile drawer ── */}
        <div
          className={[
            "md:hidden overflow-hidden transition-all duration-300 ease-in-out",
            mobileMenuOpen ? "max-h-105 opacity-100" : "max-h-0 opacity-0",
          ].join(" ")}
        >
          <div className="px-4 pb-4 pt-1 flex flex-col gap-1 border-t border-outline-variant/20">
            {NAV_LINKS.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-xl text-sm font-medium text-on-surface hover:text-primary hover:bg-surface-container-low transition-all"
              >
                {label}
              </Link>
            ))}

            <div className="my-1 h-px bg-outline-variant/20" />

            {authUser ? (
              <>
                <div className="px-3 py-1.5 text-xs text-on-surface-variant">
                  Signed in as{" "}
                  <span className="font-bold text-on-surface">{authUser.name}</span>
                </div>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2.5 rounded-xl text-sm font-semibold text-primary border border-primary/20 hover:bg-primary/8 transition-all text-center"
                >
                  Go to Dashboard
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="px-3 py-2.5 rounded-xl text-sm font-semibold text-error border border-error/20 hover:bg-error/8 transition-all text-center"
                >
                  Log Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2.5 rounded-xl text-sm font-semibold text-on-surface hover:text-primary hover:bg-surface-container-low transition-all text-center"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-3 rounded-xl text-sm font-bold text-on-primary text-center shadow-md hover:opacity-90 transition-all"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 70%, var(--color-secondary)))",
                  }}
                >
                  Get Started Free
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
