"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { toast } from "sonner";
import { trpc } from "~/trpc/client";
import { env } from "~/env";
import { CheckCircle2Icon, Loader2Icon, SparklesIcon, TerminalIcon, TrophyIcon, ShieldCheckIcon, CalendarIcon, HeartIcon, StarIcon } from "lucide-react";

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

interface FormField {
  id: string;
  key: string;
  type: string;
  label: string;
  helperText: string | null;
  placeholder: string | null;
  required: boolean;
  position: number;
  config: Record<string, any>;
}

interface FormDetails {
  id: string;
  title: string;
  description: string | null;
  themeKey: string;
  respondentEmailCopyEnabled?: boolean;
  isClosed?: boolean;
  closeReason?: "EXPIRED" | "LIMIT_REACHED" | null;
  requiresPassword?: boolean;
  unlocked?: boolean;
  closeMessage?: string | null;
  successMessage?: string | null;
  showProgressBar?: boolean;
  collectRespondentEmail?: boolean;
  thankYouTitle?: string | null;
  thankYouBody?: string | null;
  thankYouCtaText?: string | null;
  thankYouCtaUrl?: string | null;
  fields: FormField[];
}

interface FormRendererProps {
  form: FormDetails;
  isPreview?: boolean;
}

export function FormRenderer({ form, isPreview = false }: FormRendererProps) {
  const [submitted, setSubmitted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [turnstileReady, setTurnstileReady] = useState(false);
  const [turnstileWidgetId, setTurnstileWidgetId] = useState<string | null>(null);
  const [passwordInput, setPasswordInput] = useState("");
  const [unlocking, setUnlocking] = useState(false);

  const sessionKeyRef = useRef<string | null>(null);
  const hasStartedRef = useRef(false);
  const viewedFormIdRef = useRef<string | null>(null);
  
  // Respondent Info (Required if settings require, or just nice-to-have)
  const [respondentEmail, setRespondentEmail] = useState("");
  const [respondentName, setRespondentName] = useState("");
  const [sendRespondentCopy, setSendRespondentCopy] = useState(false);
  const turnstileContainerRef = useRef<HTMLDivElement | null>(null);
  const turnstileEnabled = !isPreview && !!env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const respondentCopyEnabled = form.respondentEmailCopyEnabled ?? true;
  const collectRespondentEmail = form.collectRespondentEmail ?? false;
  const showProgressBar = form.showProgressBar ?? true;

  const submitResponse = trpc.form.submitResponse.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Form submitted successfully!");
    },
    onError: (err) => {
      if (turnstileEnabled && window.turnstile) {
        window.turnstile.reset(turnstileWidgetId ?? undefined);
        setCaptchaToken(null);
      }
      toast.error(err.message || "Failed to submit response");
    },
  });

  const recordAnalyticsEvent = trpc.form.recordAnalyticsEvent.useMutation();

  useEffect(() => {
    if (isPreview) return;
    if (viewedFormIdRef.current === form.id) return;

    if (!sessionKeyRef.current && typeof window !== "undefined") {
      const storageKey = `form_session_${form.id}`;
      let sessionKey = window.sessionStorage.getItem(storageKey);
      if (!sessionKey) {
        sessionKey = typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        window.sessionStorage.setItem(storageKey, sessionKey);
      }
      sessionKeyRef.current = sessionKey;
    }

    recordAnalyticsEvent.mutate({
      formId: form.id,
      eventType: "VIEW",
      sessionKey: sessionKeyRef.current,
      source: "public",
    });
    viewedFormIdRef.current = form.id;
    // Intentionally track one VIEW event per page mount/form render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.id, isPreview]);

  const trackStart = () => {
    if (isPreview || hasStartedRef.current) return;
    hasStartedRef.current = true;
    recordAnalyticsEvent.mutate({
      formId: form.id,
      eventType: "START",
      sessionKey: sessionKeyRef.current,
      source: "public",
    });
  };

  // Calculate Progress
  const isFieldVisible = (field: FormField) => {
    const rules = field.config?.visibilityRules;
    const predicates: Array<{ fieldId: string; operator: string; value?: unknown }> = rules?.all ?? [];
    if (predicates.length === 0) return true;
    return predicates.every((p) => {
      const answer = answers[p.fieldId];
      if (p.operator === "equals") return String(answer ?? "") === String(p.value ?? "");
      if (p.operator === "not_equals") return String(answer ?? "") !== String(p.value ?? "");
      if (p.operator === "contains") {
        if (Array.isArray(answer)) return answer.map((x) => String(x)).includes(String(p.value ?? ""));
        return String(answer ?? "").includes(String(p.value ?? ""));
      }
      if (p.operator === "not_contains") {
        if (Array.isArray(answer)) return !answer.map((x) => String(x)).includes(String(p.value ?? ""));
        return !String(answer ?? "").includes(String(p.value ?? ""));
      }
      if (p.operator === "is_empty") return answer === null || answer === undefined || answer === "" || (Array.isArray(answer) && answer.length === 0);
      if (p.operator === "is_not_empty") return !(answer === null || answer === undefined || answer === "" || (Array.isArray(answer) && answer.length === 0));
      return true;
    });
  };

  const visibleFields = form.fields.filter(isFieldVisible);
  const totalFields = visibleFields.length;
  const answeredFieldsCount = visibleFields.filter((field) => {
    const val = answers[field.id];
    if (val === undefined || val === null) return false;
    if (Array.isArray(val)) return val.length > 0;
    return val !== "";
  }).length;
  const progressPercent = totalFields > 0 ? Math.round((answeredFieldsCount / totalFields) * 100) : 0;

  const handleTextChange = (fieldId: string, val: string) => {
    trackStart();
    setAnswers((prev) => ({ ...prev, [fieldId]: val }));
    if (errors[fieldId]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }
  };

  const handleSingleSelect = (fieldId: string, option: string) => {
    trackStart();
    setAnswers((prev) => ({ ...prev, [fieldId]: option }));
    if (errors[fieldId]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }
  };

  const handleMultiSelect = (fieldId: string, option: string) => {
    trackStart();
    const current = (answers[fieldId] as string[]) || [];
    let next: string[];
    if (current.includes(option)) {
      next = current.filter((x) => x !== option);
    } else {
      next = [...current, option];
    }
    setAnswers((prev) => ({ ...prev, [fieldId]: next }));
    if (errors[fieldId]) {
      setErrors((prev) => {
        const nextErr = { ...prev };
        delete nextErr[fieldId];
        return nextErr;
      });
    }
  };

  const handleCheckboxToggle = (fieldId: string, checked: boolean) => {
    trackStart();
    setAnswers((prev) => ({ ...prev, [fieldId]: checked }));
    if (errors[fieldId]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }
  };

  const handleRatingChange = (fieldId: string, rating: number) => {
    trackStart();
    setAnswers((prev) => ({ ...prev, [fieldId]: rating }));
    if (errors[fieldId]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    visibleFields.forEach((field) => {
      const val = answers[field.id];
      if (field.required) {
        if (val === undefined || val === null || val === "") {
          newErrors[field.id] = "This field is required";
        } else if (Array.isArray(val) && val.length === 0) {
          newErrors[field.id] = "Please select at least one option";
        }
      }

      // Format Validations
      if (val && field.type === "EMAIL") {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(val)) {
          newErrors[field.id] = "Please enter a valid email address";
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please correct the errors in the form before submitting.");
      return;
    }

    if (isPreview) {
      toast.info("Preview submission successful.");
      setSubmitted(true);
      return;
    }

    if (turnstileEnabled && !captchaToken) {
      toast.error("Please complete human verification before submitting.");
      return;
    }
    if (collectRespondentEmail && !respondentEmail.trim()) {
      toast.error("Email is required for this form.");
      return;
    }

    const submissionAnswers = visibleFields.map((field) => ({
      fieldId: field.id,
      fieldKey: field.key,
      value: answers[field.id] !== undefined ? answers[field.id] : null,
    }));

    submitResponse.mutate({
      formId: form.id,
      respondentEmail: respondentEmail || undefined,
      respondentName: respondentName || undefined,
      sendRespondentCopy: respondentCopyEnabled && sendRespondentCopy && !!respondentEmail.trim(),
      sessionKey: sessionKeyRef.current,
      captchaToken,
      answers: submissionAnswers,
    });
  };

  useEffect(() => {
    if (!turnstileEnabled || !turnstileReady) return;
    if (!window.turnstile || !turnstileContainerRef.current || turnstileWidgetId) return;

    const widgetId = window.turnstile.render(turnstileContainerRef.current, {
      sitekey: env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
      callback: (token: string) => setCaptchaToken(token),
      "expired-callback": () => setCaptchaToken(null),
      "error-callback": () => setCaptchaToken(null),
    });
    setTurnstileWidgetId(widgetId);
  }, [turnstileEnabled, turnstileReady, turnstileWidgetId]);

  // Render Theme Decors
  const renderThemeDecorators = () => {
    switch (form.themeKey) {
      case "anime-neon":
        return (
          <>
            <div className="absolute top-[-10%] left-[-10%] w-87.5 h-87.5 rounded-full bg-pink-500/20 blur-[100px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-87.5 h-87.5 rounded-full bg-cyan-500/20 blur-[100px] pointer-events-none" />
          </>
        );
      case "retro-arcade":
        return (
          <div className="absolute inset-0 pointer-events-none border-4 border-double border-yellow-500 opacity-20 m-4" />
        );
      case "terminal-hacker":
        return (
          <div className="absolute top-4 right-6 text-green-500/30 font-mono text-[10px] pointer-events-none select-none">
            SECURE PORT // IP: AUTH // SYS: OK
          </div>
        );
      case "startup-pitch":
        return (
          <>
            <div className="absolute top-0 right-0 w-50 h-50 bg-indigo-200/40 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute bottom-10 left-0 w-50 h-50 bg-purple-200/40 rounded-full blur-[80px] pointer-events-none" />
          </>
        );
      case "community-warm":
        return (
          <div className="absolute -bottom-12.5 -left-12.5 w-50 h-50 bg-[#d84315]/5 rounded-full pointer-events-none blur-2xl" />
        );
      default:
        return null;
    }
  };

  // Thank-You Screen Specific Styling
  const getThankYouIcon = () => {
    switch (form.themeKey) {
      case "movie-noir":
        return <TrophyIcon className="w-16 h-16 text-error" />;
      case "anime-neon":
        return <SparklesIcon className="w-16 h-16 text-[#00f0ff] animate-pulse" />;
      case "retro-arcade":
        return <TrophyIcon className="w-16 h-16 text-[#f39c12] animate-bounce" />;
      case "terminal-hacker":
        return <TerminalIcon className="w-16 h-16 text-[#00ff00]" />;
      case "startup-pitch":
        return <SparklesIcon className="w-16 h-16 text-indigo-200 animate-spin" style={{ animationDuration: '3s' }} />;
      case "community-warm":
        return <HeartIcon className="w-16 h-16 text-[#2e7d32]" />;
      default:
        return <CheckCircle2Icon className="w-16 h-16 text-[#0f62fe]" />;
    }
  };

  if (submitted) {
    return (
      <div className={`theme-container theme-${form.themeKey} flex items-center justify-center px-4 py-8 min-h-screen relative`}>
        {renderThemeDecorators()}
        <div className="theme-card max-w-2xl w-full p-8 md:p-12 text-center flex flex-col items-center gap-6 relative z-10 animate-in fade-in-50 zoom-in-95 duration-300">
          <div className="p-4 rounded-full bg-opacity-10 bg-primary flex justify-center items-center">
            {getThankYouIcon()}
          </div>
          <div>
            <h2 className="theme-title text-3xl font-extrabold tracking-tight mb-3">
              {form.thankYouTitle || "Thank you!"}
            </h2>
            <p className="theme-muted text-sm max-w-full mx-auto leading-relaxed">
              {form.thankYouBody || form.successMessage || <>We've received your response for <strong>{form.title}</strong>.</>}
            </p>
            {form.thankYouCtaText && form.thankYouCtaUrl && (
              <a href={form.thankYouCtaUrl} className="theme-button mt-4 inline-flex px-6 py-2">
                {form.thankYouCtaText}
              </a>
            )}
          </div>
          {isPreview && (
            <Button
              className="theme-button mt-4 px-6 py-2"
              onClick={() => {
                setAnswers({});
                setSubmitted(false);
              }}
            >
              Reset Preview
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (!isPreview && form.isClosed) {
    return (
      <div className={`theme-container theme-${form.themeKey} py-12 px-4 sm:px-6 relative`}>
        {renderThemeDecorators()}
        <div className="max-w-2xl mx-auto relative z-10">
          <div className="theme-card p-8 md:p-10 text-center">
            <h1 className="theme-title text-3xl font-extrabold tracking-tight mb-3">Form Closed</h1>
            <p className="theme-muted text-sm leading-relaxed whitespace-pre-line">
              {form.closeMessage || "This form is no longer accepting responses."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isPreview && form.requiresPassword && !form.unlocked) {
    return (
      <div className={`theme-container theme-${form.themeKey} py-12 px-4 sm:px-6 relative`}>
        {renderThemeDecorators()}
        <div className="max-w-md mx-auto relative z-10">
          <div className="theme-card p-8 space-y-4">
            <h2 className="theme-title text-2xl font-extrabold tracking-tight">Protected Form</h2>
            <p className="theme-muted text-sm">Enter password to access this form.</p>
            <Input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} />
            <Button
              disabled={unlocking || !passwordInput}
              onClick={async () => {
                try {
                  setUnlocking(true);
                  const apiBase = (env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/trpc").replace(/\/trpc\/?$/, "");
                  const res = await fetch(`${apiBase}/forms/unlock`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ slug: typeof window !== "undefined" ? window.location.pathname.split("/").pop() : "", password: passwordInput }),
                  });
                  if (!res.ok) throw new Error("Invalid password");
                  window.location.reload();
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Unable to unlock form");
                } finally {
                  setUnlocking(false);
                }
              }}
            >
              {unlocking ? "Unlocking..." : "Unlock Form"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`theme-container theme-${form.themeKey} py-12 px-4 sm:px-6 relative`}>
      {turnstileEnabled && (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
          onLoad={() => setTurnstileReady(true)}
        />
      )}
      {renderThemeDecorators()}
      
      <div className="max-w-2xl mx-auto relative z-10">
        {/* Progress Bar */}
        {showProgressBar && (
        <div className="mb-6 theme-card p-3 flex items-center justify-between gap-4">
          <div className="flex-1 bg-muted/40 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-primary h-full transition-all duration-300 ease-out rounded-full" 
              style={{ 
                width: `${progressPercent}%`,
                background: form.themeKey === "anime-neon" ? "linear-gradient(90deg, #ff007f, #00f0ff)" : undefined
              }} 
            />
          </div>
          <span className="text-xs font-medium theme-muted whitespace-nowrap">
            {answeredFieldsCount} of {totalFields} answered ({progressPercent}%)
          </span>
        </div>
        )}

        {/* Form Title & Description Card */}
        <div className="theme-card p-8 md:p-10 mb-8 flex flex-col gap-4">
          <div className="theme-title-container">
            <h1 className="theme-title text-3xl font-extrabold tracking-tight">
              {form.title}
            </h1>
          </div>
          {form.description && (
            <p className="theme-muted text-sm leading-relaxed whitespace-pre-line">
              {form.description}
            </p>
          )}
        </div>

        {/* Form Main Form Body */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Contact Details Capture */}
          <div className="theme-card p-6 md:p-8 space-y-4">
            <h3 className="text-base font-semibold border-b pb-2 mb-4 theme-muted uppercase tracking-wider">
              Your Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="resp-name" className="theme-label">Full Name</Label>
                <Input
                  id="resp-name"
                  placeholder="e.g. Jane Doe"
                  value={respondentName}
                  onChange={(e) => setRespondentName(e.target.value)}
                  className="theme-input w-full h-10 px-3 bg-transparent"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="resp-email" className="theme-label">Email Address</Label>
                <Input
                  id="resp-email"
                  type="email"
                  placeholder="e.g. jane@example.com"
                  value={respondentEmail}
                  onChange={(e) => setRespondentEmail(e.target.value)}
                  className="theme-input w-full h-10 px-3 bg-transparent"
                />
                {collectRespondentEmail && <p className="text-[11px] theme-muted">Email is required for this form.</p>}
              </div>
            </div>
            {respondentCopyEnabled && respondentEmail.trim().length > 0 && (
              <label className="flex items-center gap-2 text-sm theme-muted cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendRespondentCopy}
                  onChange={(e) => setSendRespondentCopy(e.target.checked)}
                  className="w-4 h-4 rounded border border-slate-400"
                />
                Email me a copy of my submitted response
              </label>
            )}
          </div>

          {/* Form Dynamic Fields */}
          {visibleFields.map((field) => {
            const hasError = !!errors[field.id];
            const isOptionsType = ["SINGLE_SELECT", "MULTI_SELECT"].includes(field.type);
            const options: string[] = field.config?.options || [];

            return (
              <div key={field.id} className="theme-card p-6 md:p-8 space-y-4 animate-in fade-inslide-in-from-bottom-2 duration-300">
                <div className="space-y-1">
                  <Label className="theme-label text-base flex items-center flex-wrap gap-1">
                    {field.label}
                    {field.required && <span className="text-destructive font-bold ml-0.5">*</span>}
                  </Label>
                  {field.helperText && (
                    <p className="theme-muted text-xs opacity-80 leading-normal">{field.helperText}</p>
                  )}
                </div>

                {/* Field Render Logic */}
                <div className="mt-2">
                  {field.type === "SHORT_TEXT" && (
                    <Input
                      placeholder={field.placeholder || "Type your answer here..."}
                      value={answers[field.id] || ""}
                      onChange={(e) => handleTextChange(field.id, e.target.value)}
                      maxLength={field.config?.maxLength}
                      className="theme-input w-full h-10 px-3 bg-transparent"
                    />
                  )}

                  {field.type === "EMAIL" && (
                    <Input
                      type="email"
                      placeholder={field.placeholder || "name@example.com"}
                      value={answers[field.id] || ""}
                      onChange={(e) => handleTextChange(field.id, e.target.value)}
                      maxLength={field.config?.maxLength}
                      className="theme-input w-full h-10 px-3 bg-transparent"
                    />
                  )}

                  {field.type === "LONG_TEXT" && (
                    <Textarea
                      placeholder={field.placeholder || "Type a longer answer here..."}
                      value={answers[field.id] || ""}
                      onChange={(e) => handleTextChange(field.id, e.target.value)}
                      maxLength={field.config?.maxLength}
                      rows={4}
                      className="theme-input w-full p-3 bg-transparent resize-y min-h-25"
                    />
                  )}

                  {field.type === "NUMBER" && (
                    <Input
                      type="number"
                      placeholder={field.placeholder || "Enter a number..."}
                      value={answers[field.id] || ""}
                      onChange={(e) => handleTextChange(field.id, e.target.value)}
                      min={field.config?.min}
                      max={field.config?.max}
                      className="theme-input w-full h-10 px-3 bg-transparent"
                    />
                  )}

                  {field.type === "DATE" && (
                    <div className="relative">
                      <Input
                        type="date"
                        value={answers[field.id] || ""}
                        onChange={(e) => handleTextChange(field.id, e.target.value)}
                        min={field.config?.minDate}
                        max={field.config?.maxDate}
                        className="theme-input w-full h-10 px-3 bg-transparent pr-10"
                      />
                      <CalendarIcon className="absolute right-3 top-3 w-4 h-4 opacity-40 theme-muted pointer-events-none" />
                    </div>
                  )}

                  {field.type === "CHECKBOX" && (
                    <label className="flex items-center space-x-3 cursor-pointer group mt-2">
                      <input
                        type="checkbox"
                        checked={!!answers[field.id]}
                        onChange={(e) => handleCheckboxToggle(field.id, e.target.checked)}
                        className={`w-5 h-5 rounded border-2 cursor-pointer transition-all duration-150
                          ${answers[field.id] 
                            ? "bg-primary border-primary accent-primary" 
                            : "bg-transparent border-slate-400 group-hover:border-primary"
                          }`}
                        style={{
                          accentColor: form.themeKey === "anime-neon" ? "#ff007f" : undefined
                        }}
                      />
                      <span className="text-sm font-medium theme-muted">I agree / Yes</span>
                    </label>
                  )}

                  {field.type === "SINGLE_SELECT" && (
                    <div className="grid grid-cols-1 gap-2.5">
                      {options.map((opt) => {
                        const isSelected = answers[field.id] === opt;
                        return (
                          <div
                            key={opt}
                            onClick={() => handleSingleSelect(field.id, opt)}
                            className={`theme-option-card px-4 py-3 flex items-center justify-between border select-none ${isSelected ? 'selected' : ''}`}
                          >
                            <span className="text-sm font-medium">{opt}</span>
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${isSelected ? 'bg-current border-transparent' : 'bg-transparent border-slate-400'}`}>
                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-background" />}
                            </div>
                          </div>
                        );
                      })}
                      {options.length === 0 && (
                        <p className="text-xs italic theme-muted">No options configured.</p>
                      )}
                    </div>
                  )}

                  {field.type === "MULTI_SELECT" && (
                    <div className="grid grid-cols-1 gap-2.5">
                      {options.map((opt) => {
                        const currentSelections = (answers[field.id] as string[]) || [];
                        const isSelected = currentSelections.includes(opt);
                        return (
                          <div
                            key={opt}
                            onClick={() => handleMultiSelect(field.id, opt)}
                            className={`theme-option-card px-4 py-3 flex items-center justify-between border select-none ${isSelected ? 'selected' : ''}`}
                          >
                            <span className="text-sm font-medium">{opt}</span>
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${isSelected ? 'bg-current border-transparent' : 'bg-transparent border-slate-400'}`}>
                              {isSelected && (
                                <svg className="w-3 h-3 text-background fill-none stroke-current" strokeWidth="3" viewBox="0 0 24 24">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {options.length === 0 && (
                        <p className="text-xs italic theme-muted">No options configured.</p>
                      )}
                    </div>
                  )}

                  {field.type === "RATING" && (
                    <div className="flex items-center gap-2">
                      {Array.from({ length: Math.max(1, Number(field.config?.maxRating) || 5) }).map((_, idx) => {
                        const value = idx + 1;
                        const isActive = Number(answers[field.id] || 0) >= value;
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => handleRatingChange(field.id, value)}
                            className={`p-1 rounded-full transition-colors ${isActive ? "text-primary" : "text-slate-400"}`}
                            aria-label={`Rate ${value}`}
                          >
                            <StarIcon className={`w-6 h-6 ${isActive ? "fill-current" : ""}`} />
                          </button>
                        );
                      })}
                      <span className="text-xs theme-muted">{answers[field.id] || 0} / {field.config?.maxRating || 5}</span>
                    </div>
                  )}
                </div>

                {/* Validation Error Message */}
                {hasError && (
                  <p className="text-xs font-semibold text-destructive mt-1 flex items-center gap-1 animate-bounce">
                    ⚠️ {errors[field.id]}
                  </p>
                )}
              </div>
            );
          })}

          {/* Submit Button */}
          {turnstileEnabled && (
            <div className="theme-card p-6 md:p-8">
              <p className="text-xs theme-muted mb-3">Human verification</p>
              <div ref={turnstileContainerRef} />
            </div>
          )}
          <div className="pt-4 flex justify-end">
            <Button
              type="submit"
              disabled={submitResponse.isPending}
              className="theme-button px-8 py-3 h-auto text-base flex items-center gap-2 w-full sm:w-auto shadow-md"
            >
              {submitResponse.isPending ? (
                <>
                  <Loader2Icon className="w-4 h-4 animate-spin" /> Submitting...
                </>
              ) : (
                "Submit Answers"
              )}
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
}
