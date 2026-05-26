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
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50/50 px-6">
        <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-300">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-900/5">
            <Loader2Icon className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest animate-pulse">
            Loading Form...
          </p>
        </div>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50/50 px-6 py-12 text-center">
        <div className="max-w-md w-full p-8 flex flex-col items-center gap-6 bg-white rounded-3xl shadow-xl ring-1 ring-slate-900/5 animate-in fade-in zoom-in-95 duration-300">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center border border-red-100 text-red-500">
            <FileQuestionIcon className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">Form Unavailable</h1>
            <p className="text-sm text-slate-500 leading-relaxed font-medium">
              This form could not be loaded. It might have been deleted, set to draft/unpublished state, or the link is incorrect.
            </p>
          </div>
          <div className="flex flex-col gap-2 w-full pt-4">
            <Button 
              onClick={() => router.push("/")} 
              className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
            >
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
