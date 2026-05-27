"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  clearPendingSignup,
  getPendingSignup,
  setAuthSession,
  type PendingSignup,
} from "~/lib/auth-session";
import { trpc } from "~/trpc/client";

export function SignupVerificationForm() {
  const router = useRouter();
  const [otp, setOtp] = useState("");
  const [pending, setPending] = useState<PendingSignup | null>(null);

  const resendOtpMutation = trpc.auth.sendEmailVerificationCode.useMutation();
  const signUpMutation = trpc.auth.signUpWithEmail.useMutation();

  useEffect(() => {
    const stored = getPendingSignup();
    if (!stored) {
      router.replace("/signup");
      return;
    }
    setPending(stored);
  }, [router]);

  const handleResend = async () => {
    if (!pending) return;
    try {
      await resendOtpMutation.mutateAsync({ email: pending.email });
      toast.success("Verification code resent");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to resend code");
    }
  };

  const handleChangeEmail = () => {
    clearPendingSignup();
    router.push("/signup");
  };

  const handleVerify = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!pending) return;

    try {
      const result = await signUpMutation.mutateAsync({
        name: pending.name,
        email: pending.email,
        password: pending.password,
        otp,
      });

      clearPendingSignup();
      setAuthSession(result);
      toast.success("Account created successfully");
      router.push("/");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Verification failed");
    }
  };

  return (
    <div className="bg-background text-on-surface font-body-md antialiased min-h-screen flex flex-col relative overflow-x-hidden">
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary-fixed/30 rounded-full blur-[120px]"></div>
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-secondary-fixed/30 rounded-full blur-[100px]"></div>
      </div>

      <nav className="relative z-10 flex justify-between items-center w-full px-margin py-6 max-w-7xl mx-auto">
        <Link
          className="text-headline-md font-headline-md font-bold tracking-tight text-on-surface flex items-center gap-ds-xs hover:opacity-80 transition-opacity"
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

      <main className="grow flex items-center justify-center relative z-10 w-full px-6 sm:px-8">
        <div
          className="w-full bg-surface-container-lowest rounded-2xl border border-outline-variant/40 p-6 sm:p-10"
          style={{ maxWidth: "480px", minWidth: "320px" }}
        >
          <div className="mb-8 rounded-lg border border-primary/30 bg-primary/10 p-4 text-sm text-on-surface leading-6 wrap-break-word">
            Verification code has been sent to{" "}
            <strong className="break-all">{pending?.email ?? "your email"}</strong>.
          </div>

          <form className="flex flex-col gap-6" onSubmit={handleVerify}>
            <div className="flex flex-col gap-2">
              <label className="font-semibold text-on-surface text-sm">Verification Code</label>
              <input
                type="text"
                value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="6-digit code"
                className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200"
                style={{ padding: "12px 24px", fontSize: "16px" }}
                required
                minLength={6}
                maxLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={signUpMutation.isPending}
              className="w-full font-bold bg-linear-to-r from-primary to-primary-container text-on-primary rounded-lg shadow-[0_4px_14px_0_rgba(70,72,212,0.39)] hover:shadow-[0_6px_20px_rgba(70,72,212,0.23)] hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-70 disabled:hover:translate-y-0"
              style={{ padding: "14px 40px", fontSize: "14px" }}
            >
              {signUpMutation.isPending ? "Verifying..." : "Create Account"}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={handleResend}
              disabled={resendOtpMutation.isPending || !pending}
              className="text-primary font-medium disabled:text-on-surface-variant"
            >
              {resendOtpMutation.isPending ? "Resending..." : "Resend"}
            </button>
            <button
              type="button"
              onClick={handleChangeEmail}
              className="text-on-surface-variant hover:text-primary"
            >
              Change email
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
