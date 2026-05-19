"use client";

import Link from "next/link";
import { useState } from "react";

export function AuthForm({ type }: { type: "login" | "signup" }) {
  const [showPassword, setShowPassword] = useState(false);
  const isLogin = type === "login";
  const title = isLogin ? "Welcome back" : "Create an account";
  const subtitle = isLogin
    ? "Enter your details to access your account."
    : "Sign up to start building beautiful forms.";

  return (
    <div className="bg-background text-on-surface font-body-md antialiased min-h-screen flex flex-col relative overflow-x-hidden">
      {/* Ambient Background Elements */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary-fixed/30 rounded-full blur-[120px]"></div>
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-secondary-fixed/30 rounded-full blur-[100px]"></div>
      </div>

      <nav className="relative z-10 flex justify-between items-center w-full px-margin py-6 max-w-7xl mx-auto">
        <Link
          className="text-headline-md font-headline-md font-bold tracking-tight text-on-surface flex items-center gap-xs hover:opacity-80 transition-opacity"
          href="/"
        >
          <span
            className="material-symbols-outlined text-primary"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            layers
          </span>
          ZenForm
        </Link>
      </nav>

      <main
        className="flex-grow flex items-center justify-center relative z-10 w-full"
        style={{ padding: "64px 32px" }}
      >
        <div
          className="w-full bg-surface-container-lowest rounded-2xl border border-outline-variant/40 soft-focus-shadow hover-lift relative overflow-hidden group"
          style={{ maxWidth: "448px", padding: "40px" }}
        >
          {/* Decorative subtle top gradient */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>

          <div
            className="absolute top-[-50px] right-[-50px] bg-primary-fixed/20 rounded-bl-full -z-10 transition-transform group-hover:scale-110 duration-500"
            style={{ width: "128px", height: "128px" }}
          ></div>

          <div className="text-center" style={{ marginBottom: "40px" }}>
            <h1
              className="font-bold text-on-surface"
              style={{ fontSize: "24px", marginBottom: "8px" }}
            >
              {title}
            </h1>
            <p className="text-on-surface-variant" style={{ fontSize: "16px" }}>
              {subtitle}
            </p>
          </div>

          <form className="flex flex-col" style={{ gap: "24px" }}>
            {!isLogin && (
              <div className="flex flex-col" style={{ gap: "8px" }}>
                <label className="font-semibold text-on-surface" style={{ fontSize: "14px" }}>
                  Name
                </label>
                <input
                  type="text"
                  placeholder="John Doe"
                  className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200"
                  style={{ padding: "12px 24px", fontSize: "16px" }}
                />
              </div>
            )}
            <div className="flex flex-col" style={{ gap: "8px" }}>
              <label className="font-semibold text-on-surface" style={{ fontSize: "14px" }}>
                Email
              </label>
              <input
                type="email"
                placeholder="hello@example.com"
                className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200"
                style={{ padding: "12px 24px", fontSize: "16px" }}
              />
            </div>
            <div className="flex flex-col" style={{ gap: "8px" }}>
              <div className="flex justify-between items-center">
                <label className="font-semibold text-on-surface" style={{ fontSize: "14px" }}>
                  Password
                </label>
                {isLogin && (
                  <Link
                    href="#"
                    className="font-medium text-primary hover:underline"
                    style={{ fontSize: "14px" }}
                  >
                    Forgot password?
                  </Link>
                )}
              </div>
              <div className="relative w-full">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200"
                  style={{ padding: "12px 48px 12px 24px", fontSize: "16px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center"
                  style={{ width: "24px", height: "24px" }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full font-bold bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-lg shadow-[0_4px_14px_0_rgba(70,72,212,0.39)] hover:shadow-[0_6px_20px_rgba(70,72,212,0.23)] hover:-translate-y-0.5 transition-all duration-200"
              style={{ padding: "14px 40px", marginTop: "8px", fontSize: "14px" }}
            >
              {isLogin ? "Sign In" : "Create Account"}
            </button>
          </form>

          <div className="flex items-center" style={{ gap: "16px", margin: "32px 0" }}>
            <div className="h-px bg-outline-variant/40 flex-1"></div>
            <span
              className="font-medium text-on-surface-variant uppercase tracking-wider"
              style={{ fontSize: "12px" }}
            >
              Or continue with
            </span>
            <div className="h-px bg-outline-variant/40 flex-1"></div>
          </div>

          <button
            className="w-full font-bold bg-surface-container-lowest border border-outline-variant/50 text-on-surface rounded-lg hover:border-primary hover:text-primary transition-all duration-200 flex items-center justify-center soft-focus-shadow"
            style={{ padding: "14px 40px", gap: "12px", fontSize: "14px" }}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Google
          </button>

          <p
            className="text-center text-on-surface-variant"
            style={{ fontSize: "16px", marginTop: "32px" }}
          >
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <Link
              href={isLogin ? "/signup" : "/login"}
              className="text-primary font-bold hover:underline transition-all"
            >
              {isLogin ? "Sign up" : "Log in"}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
