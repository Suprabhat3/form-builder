"use client";

import { RequireAuth } from "~/components/auth/RequireAuth";
import { trpc } from "~/trpc/client";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useMemo, useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { PlusIcon, Edit3Icon, Trash2Icon, GlobeIcon, LockIcon, SparklesIcon, ExternalLinkIcon, Share2Icon, BarChart3Icon, ClipboardListIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { toast } from "sonner";

const themeMetadata: Record<string, { bg: string; primary: string; secondary: string; desc: string }> = {
  "movie-noir": { bg: "#0a0a0c", primary: "#ba1a1a", secondary: "#111116", desc: "Film noir grain backdrop with striking contrast shadow drama" },
  "anime-neon": { bg: "#0b0314", primary: "#ff007f", secondary: "#00f0ff", desc: "Cyberpunk Tokyo neon halos and glowing glassmorphism panels" },
  "retro-arcade": { bg: "#0d0d15", primary: "#39ff14", secondary: "#f39c12", desc: "80s monospaced console, scanlines, and bouncy trophy icons" },
  "silicon-minimal": { bg: "#f8fafc", primary: "#0f62fe", secondary: "#64748b", desc: "Clean modern SaaS matrix background with soft micro-shadows" },
  "terminal-hacker": { bg: "#020202", primary: "#00ff00", secondary: "#008800", desc: "Phosphor green-on-black terminal system console prompt layout" },
  "startup-pitch": { bg: "#f5f3ff", primary: "#4f46e5", secondary: "#312e81", desc: "Rounded curve templates with clean violet gradients and pills" },
  "hackathon-rush": { bg: "#facc15", primary: "#000000", secondary: "#ffffff", desc: "High voltage brutalist neon-yellow with thick offset borders" },
  "community-warm": { bg: "#FAF6F0", primary: "#2e7d32", secondary: "#FAF6F0", desc: "Warm organic ivory bases, forest greens and cozy heart accents" },
};

export default function DashboardPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const router = useRouter();

  return (
    <RequireAuth>
      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
            <p className="mt-1.5 text-sm text-slate-500 font-medium">
              Manage your forms, view responses, and customize settings.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button 
              variant="outline" 
              className="gap-2 bg-white hover:bg-slate-50 border-slate-200 shadow-sm font-semibold text-slate-700"
              onClick={() => router.push('/templates')}
            >
              <SparklesIcon className="w-4 h-4 text-primary" />
              Explore Templates
            </Button>
            <Suspense fallback={null}>
              <CreateFormDialog open={createOpen} onOpenChange={setCreateOpen} />
            </Suspense>
          </div>
        </div>

        <FormsList />
      </main>
    </RequireAuth>
  );
}

function CreateFormDialog({
  open,
  onOpenChange,
  defaultThemeKey,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultThemeKey?: string | null;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [themeKey, setThemeKey] = useState("movie-noir");
  const [visibility, setVisibility] = useState("PUBLIC");
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const themeParam = searchParams.get("theme");

  const { data: themes } = trpc.form.getThemeCatalog.useQuery();

  // Deep-linking theme pre-selection
  useEffect(() => {
    if (themeParam && Object.keys(themeMetadata).includes(themeParam)) {
      setThemeKey(themeParam);
      onOpenChange(true);

      // Instantly clean up query parameter to keep dashboard refresh clean
      const cleanedUrl = window.location.pathname;
      window.history.replaceState({}, "", cleanedUrl);
    }
  }, [themeParam, onOpenChange]);

  useEffect(() => {
    if (defaultThemeKey && Object.keys(themeMetadata).includes(defaultThemeKey)) {
      setThemeKey(defaultThemeKey);
    }
  }, [defaultThemeKey]);
  
  const utils = trpc.useUtils();
  const createForm = trpc.form.create.useMutation({
    onSuccess: (data) => {
      toast.success("Form created successfully!");
      onOpenChange(false);
      // Reset state fields
      setTitle("");
      setDescription("");
      utils.form.listMine.invalidate();
      utils.form.listPublic.invalidate();
      router.push(`/builder/${data.id}`);
    },
    onError: (err: { message: string }) => {
      toast.error(err.message || "Failed to create form");
    }
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createForm.mutate({ title, description, themeKey: themeKey as any, visibility: visibility as any });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <PlusIcon className="w-4 h-4" />
          Create Form
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-162.5 max-h-[90vh] overflow-y-auto">
        <form onSubmit={onSubmit} className="space-y-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Create New Form</DialogTitle>
            <DialogDescription>
              Specify your settings and choose a starting theme to bring your form design to life.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6">
            {/* Title and Description */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="title" className="font-semibold text-xs">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="E.g., Event Registration"
                  required
                  className="h-10"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="visibility" className="font-semibold text-xs">Visibility</Label>
                <Select value={visibility} onValueChange={setVisibility}>
                  <SelectTrigger id="visibility" className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PUBLIC">Public</SelectItem>
                    <SelectItem value="UNLISTED">Unlisted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description" className="font-semibold text-xs">Description (Optional)</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Write a warm invitation description..."
                className="h-10"
              />
            </div>

            {/* Visual Grid-Based Theme Selector */}
            <div className="grid gap-2">
              <div className="flex justify-between items-center">
                <Label className="font-semibold text-xs">Select Visual Template</Label>
                <span className="text-[10px] text-muted-foreground font-mono">
                  ACTIVE: {themeKey.toUpperCase()}
                </span>
              </div>

              {/* Scrollable Visual Theme picker Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-65 overflow-y-auto pr-1 py-1 border rounded-xl p-3 bg-slate-50/50">
                {themes?.map((t) => {
                  const isSelected = themeKey === t.key;
                  const colors = themeMetadata[t.key] || { bg: "#ffffff", primary: "#000000", secondary: "#cccccc", desc: "" };

                  return (
                    <div
                      key={t.key}
                      onClick={() => setThemeKey(t.key)}
                      className={`cursor-pointer group relative flex flex-col justify-between p-3 rounded-xl border text-left transition-all duration-150 select-none ${
                        isSelected 
                          ? "bg-white border-primary ring-2 ring-primary/10 shadow-sm" 
                          : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs"
                      }`}
                    >
                      <div>
                        {/* Title & Category Badge */}
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            {t.label}
                            {isSelected && (
                              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                            )}
                          </span>
                          <span className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground bg-slate-100 px-1.5 py-0.5 rounded">
                            {t.category}
                          </span>
                        </div>
                        {/* Tagline Description */}
                        <p className="text-[10px] text-slate-500 line-clamp-2 leading-normal mb-2.5">
                          {colors.desc}
                        </p>
                      </div>

                      {/* Color Palette Indicators */}
                      <div className="flex gap-1.5 items-center border-t pt-2 mt-auto">
                        <div className="flex -space-x-1 border rounded-full p-0.5 bg-slate-50 shrink-0">
                          <div className="w-3.5 h-3.5 rounded-full border border-white" style={{ backgroundColor: colors.bg }} />
                          <div className="w-3.5 h-3.5 rounded-full border border-white" style={{ backgroundColor: colors.primary }} />
                          <div className="w-3.5 h-3.5 rounded-full border border-white" style={{ backgroundColor: colors.secondary }} />
                        </div>
                        <span className="text-[9px] font-mono text-muted-foreground uppercase opacity-70">
                          {colors.primary}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="border-t pt-4">
            <Button variant="ghost" type="button" onClick={() => onOpenChange(false)} className="h-10 text-xs">
              Cancel
            </Button>
            <Button type="submit" disabled={createForm.isPending} className="bg-primary hover:bg-primary/95 font-bold h-10 px-6 text-xs">
              {createForm.isPending ? "Creating Form..." : "Create & Edit Form"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}



function ShareDialog({
  open,
  onOpenChange,
  title,
  slug,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  slug: string;
}) {
  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/f/${slug}`;
  }, [slug]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-2 border-slate-200 shadow-xl rounded-2xl">
        <DialogHeader className="space-y-4">
          <div className="mx-auto bg-green-100/50 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-2">
            <Share2Icon className="w-8 h-8 text-green-600" />
          </div>
          <DialogTitle className="text-center text-2xl font-bold">Share your form</DialogTitle>
          <DialogDescription className="text-center text-slate-500">
            You're ready to collect responses! Distribute this link anywhere.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4 pb-2">
          <div className="space-y-2">
            <Label htmlFor="share-link" className="font-semibold text-xs uppercase tracking-wider text-slate-500">Public Link</Label>
            <div className="flex gap-2 items-center bg-slate-50 p-2 rounded-xl border">
              <div className="bg-white px-3 py-2.5 rounded-lg border shadow-sm flex-1 truncate text-sm font-mono text-slate-700">
                {shareUrl}
              </div>
              <Button
                type="button"
                variant="default"
                className="gap-2 shrink-0 bg-slate-800 hover:bg-slate-900"
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl);
                  toast.success("Link copied to clipboard!");
                }}
              >
                Copy Link
              </Button>
            </div>
          </div>
          {shareUrl && (
            <div className="flex flex-col items-center gap-2">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(shareUrl)}`}
                alt="QR code"
                className="rounded-lg border"
              />
              <a
                href={`https://api.qrserver.com/v1/create-qr-code/?size=800x800&data=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                className="text-xs text-slate-500 underline"
                rel="noreferrer"
              >
                Download QR
              </a>
            </div>
          )}
        </div>
        <DialogFooter className="border-t pt-4 mt-2 sm:justify-between items-center">
          <Button
            type="button"
            variant="ghost"
            className="text-slate-500 hover:text-primary gap-2"
            onClick={() => window.open(`/f/${slug}`, "_blank")}
          >
            <ExternalLinkIcon className="h-4 w-4" />
            Open live preview
          </Button>
          <Button type="button" className="px-8 font-semibold" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FormsList() {
  const { data: forms, isLoading } = trpc.form.listMine.useQuery();
  const router = useRouter();
  const utils = trpc.useUtils();
  const [shareOpen, setShareOpen] = useState(false);
  const [shareTarget, setShareTarget] = useState<{ title: string; slug: string } | null>(null);
  const [pendingShare, setPendingShare] = useState<{ id: string; title: string; slug: string } | null>(null);
  const markTemplate = trpc.form.markAsTemplate.useMutation({
    onSuccess: () => {
      utils.form.listMine.invalidate();
      toast.success("Template setting updated");
    },
  });
  
  const publishForm = trpc.form.publish.useMutation({
    onSuccess: (_data, variables) => {
      toast.success("Form published!");
      utils.form.listMine.invalidate();
      utils.form.listPublic.invalidate();
      if (pendingShare?.id === variables.formId) {
        setShareTarget({ title: pendingShare.title, slug: pendingShare.slug });
        setShareOpen(true);
        setPendingShare(null);
      }
    },
  });
  
  const unpublishForm = trpc.form.unpublish.useMutation({
    onSuccess: () => {
      toast.success("Form unpublished!");
      utils.form.listMine.invalidate();
      utils.form.listPublic.invalidate();
    },
  });

  const archiveForm = trpc.form.archive.useMutation({
    onSuccess: () => {
      toast.success("Form archived!");
      utils.form.listMine.invalidate();
      utils.form.listPublic.invalidate();
    },
  });

  if (isLoading) {
    return <div className="text-center py-12 text-muted-foreground">Loading forms...</div>;
  }

  if (!forms || forms.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center py-16 text-center border-dashed">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Edit3Icon className="w-8 h-8 text-muted-foreground" />
        </div>
        <CardTitle className="mb-2">No forms yet</CardTitle>
        <CardDescription>
          Create your first form to start collecting responses.
        </CardDescription>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {forms.map((form) => (
        <Card key={form.id} className="group flex flex-col justify-between overflow-hidden border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-200 bg-white">
          <div>
            <div className="p-6 pb-4">
              <div className="flex justify-between items-start mb-3">
                <Badge
                  variant={form.status === "PUBLISHED" ? "default" : "secondary"}
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider shadow-none ${
                    form.status === "DRAFT"
                      ? "bg-amber-100 text-amber-800 border border-amber-200"
                      : ""
                  }`}
                >
                  {form.status.toLowerCase()}
                </Badge>
                <div className="flex items-center text-xs text-slate-500 font-medium bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                  {form.visibility === "PUBLIC" ? <GlobeIcon className="w-3.5 h-3.5 mr-1.5 text-slate-400" /> : <LockIcon className="w-3.5 h-3.5 mr-1.5 text-slate-400" />}
                  {form.visibility.toLowerCase()}
                </div>
              </div>
              <CardTitle className="text-xl font-bold text-slate-900 group-hover:text-primary transition-colors line-clamp-1">
                {form.title}
              </CardTitle>
              <div className="mt-2 flex items-center text-xs font-medium text-slate-500" suppressHydrationWarning>
                Updated {new Date(form.updatedAt).toLocaleDateString()}
              </div>
            </div>
            
            <div className="px-6 pb-6">
              <div className="flex flex-wrap items-end justify-between gap-4 bg-slate-50/50 rounded-xl p-4 border border-slate-100">
                <div>
                  <div className="text-3xl font-black text-slate-900 tracking-tight leading-none">{form.responseCount}</div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-1.5">Responses</div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="h-8 px-3 gap-1.5 bg-white shadow-sm hover:bg-slate-50 hover:border-slate-300 hover:shadow transition-all cursor-pointer border-slate-200" onClick={() => router.push(`/dashboard/forms/${form.id}/analytics`)}>
                    <BarChart3Icon className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-xs font-semibold">Analytics</span>
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 px-3 gap-1.5 bg-white shadow-sm hover:bg-slate-50 hover:border-slate-300 hover:shadow transition-all cursor-pointer border-slate-200" onClick={() => router.push(`/dashboard/forms/${form.id}/responses`)}>
                    <ClipboardListIcon className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-xs font-semibold">Responses</span>
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 px-3 bg-white" onClick={() => markTemplate.mutate({ formId: form.id, isTemplate: !form.isTemplate })}>
                    <span className="text-xs font-semibold">{form.isTemplate ? "Unmark Template" : "Save Template"}</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <CardFooter className="p-4 px-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
            <Button variant="ghost" size="sm" className="h-8 px-2.5 gap-1.5 font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 transition-all cursor-pointer" onClick={() => router.push(`/builder/${form.id}`)}>
              <Edit3Icon className="w-4 h-4 text-slate-400" /> 
              <span>Edit</span>
            </Button>
            
            <div className="flex items-center gap-2">
              {form.status === "PUBLISHED" ? (
                <>
                  <Button variant="default" size="sm" className="h-8 gap-1.5 shadow-sm font-semibold hover:opacity-90 hover:shadow transition-all cursor-pointer" onClick={() => {
                    setShareTarget({ title: form.title, slug: form.slug });
                    setShareOpen(true);
                  }}>
                    <Share2Icon className="w-3.5 h-3.5" /> Share
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 px-2 transition-all cursor-pointer" onClick={() => unpublishForm.mutate({ formId: form.id })} disabled={unpublishForm.isPending}>
                    Unpublish
                  </Button>
                </>
              ) : (
                <Button variant="default" size="sm" className="h-8 gap-1.5 bg-slate-800 hover:bg-slate-900 shadow-sm font-semibold transition-all cursor-pointer hover:shadow" onClick={() => {
                    setPendingShare({ id: form.id, title: form.title, slug: form.slug });
                    publishForm.mutate({ formId: form.id });
                }} disabled={publishForm.isPending || form.status === "ARCHIVED"}>
                  <SparklesIcon className="w-3.5 h-3.5" /> Publish
                </Button>
              )}
              
              {form.status !== "ARCHIVED" && (
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 ml-1.5 transition-all cursor-pointer" onClick={() => {
                  if (confirm("Are you sure you want to archive this form?")) {
                    archiveForm.mutate({ formId: form.id });
                  }
                }} disabled={archiveForm.isPending} title="Archive Form">
                  <Trash2Icon className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      ))}

      {shareTarget && (
        <ShareDialog
          open={shareOpen}
          onOpenChange={setShareOpen}
          title={shareTarget.title}
          slug={shareTarget.slug}
        />
      )}
    </div>
  );
}
