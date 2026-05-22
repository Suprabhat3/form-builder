"use client";

import { use } from "react";
import { trpc } from "~/trpc/client";
import { FormRenderer } from "~/components/forms/FormRenderer";
import { Button } from "~/components/ui/button";
import { useRouter } from "next/navigation";
import { AlertCircleIcon, ArrowLeftIcon, FileQuestionIcon, GhostIcon, Loader2Icon } from "lucide-react";

export default function PublicFormPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();

  const { data: form, isLoading, error } = trpc.form.getBySlug.useQuery({ slug }, {
    retry: false, // Don't retry if not found
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-100 gap-4">
        <div className="relative">
          <Loader2Icon className="w-12 h-12 text-primary animate-spin" />
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-[10px]" />
        </div>
        <p className="text-sm font-mono tracking-wider animate-pulse">
          FETCHING FORM INTERFACE...
        </p>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-100 px-6 py-12 text-center">
        <div className="theme-card max-w-md w-full p-8 flex flex-col items-center gap-6 border-slate-800 bg-slate-900/40 backdrop-blur-md rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center border border-destructive/20 text-destructive shadow-[0_0_15px_rgba(239,68,68,0.15)]">
            <FileQuestionIcon className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight mb-2">Form Unavailable</h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              This form could not be loaded. It might have been deleted, set to draft/unpublished state, or the link is incorrect.
            </p>
          </div>
          <div className="flex flex-col gap-2 w-full pt-2">
            <Button onClick={() => router.push("/")} className="w-full h-11 bg-primary text-primary-foreground font-semibold rounded-xl flex items-center justify-center gap-2 hover:translate-y-[-1px] transition-transform duration-150">
              <ArrowLeftIcon className="w-4 h-4" /> Go to Homepage
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen">
      <FormRenderer form={form} isPreview={false} />
    </main>
  );
}
