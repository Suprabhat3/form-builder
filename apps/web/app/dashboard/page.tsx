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
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { PlusIcon, SettingsIcon, Edit3Icon, Trash2Icon, GlobeIcon, LockIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { toast } from "sonner";

export default function DashboardPage() {
  return (
    <RequireAuth>
      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="mt-1 text-muted-foreground">
              Manage your forms, view responses, and customize settings.
            </p>
          </div>
          <CreateFormDialog />
        </div>
        
        <FormsList />
      </main>
    </RequireAuth>
  );
}

function CreateFormDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [themeKey, setThemeKey] = useState("movie-noir");
  const [visibility, setVisibility] = useState("PUBLIC");
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const themeParam = searchParams.get("theme");

  const { data: themes } = trpc.form.getThemeCatalog.useQuery();

  // Color Swatches Map for visual selection preview
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

  // Deep-linking theme pre-selection
  useEffect(() => {
    if (themeParam && Object.keys(themeMetadata).includes(themeParam)) {
      setThemeKey(themeParam);
      setOpen(true);

      // Instantly clean up query parameter to keep dashboard refresh clean
      const cleanedUrl = window.location.pathname;
      window.history.replaceState({}, "", cleanedUrl);
    }
  }, [themeParam]);
  
  const utils = trpc.useUtils();
  const createForm = trpc.form.create.useMutation({
    onSuccess: (data) => {
      toast.success("Form created successfully!");
      setOpen(false);
      // Reset state fields
      setTitle("");
      setDescription("");
      utils.form.listMine.invalidate();
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <PlusIcon className="w-4 h-4" />
          Create Form
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[260px] overflow-y-auto pr-1 py-1 border rounded-xl p-3 bg-slate-50/50">
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
            <Button variant="ghost" type="button" onClick={() => setOpen(false)} className="h-10 text-xs">
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

function FormsList() {
  const { data: forms, isLoading } = trpc.form.listMine.useQuery();
  const router = useRouter();
  const utils = trpc.useUtils();
  
  const publishForm = trpc.form.publish.useMutation({
    onSuccess: () => {
      toast.success("Form published!");
      utils.form.listMine.invalidate();
    },
  });
  
  const unpublishForm = trpc.form.unpublish.useMutation({
    onSuccess: () => {
      toast.success("Form unpublished!");
      utils.form.listMine.invalidate();
    },
  });

  const archiveForm = trpc.form.archive.useMutation({
    onSuccess: () => {
      toast.success("Form archived!");
      utils.form.listMine.invalidate();
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
        <Card key={form.id} className="flex flex-col overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-start mb-2">
              <Badge variant={form.status === "PUBLISHED" ? "default" : "secondary"}>
                {form.status.toLowerCase()}
              </Badge>
              <div className="flex items-center text-xs text-muted-foreground gap-1">
                {form.visibility === "PUBLIC" ? <GlobeIcon className="w-3 h-3" /> : <LockIcon className="w-3 h-3" />}
                {form.visibility.toLowerCase()}
              </div>
            </div>
            <CardTitle className="line-clamp-1">{form.title}</CardTitle>
            <CardDescription className="text-xs mt-1">
              Updated {new Date(form.updatedAt).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pb-4 space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-slate-800">{form.responseCount}</span> responses
            </div>
            
            {form.status === "PUBLISHED" && (
              <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-50/80 border text-xs">
                <span className="truncate text-slate-500 select-all font-mono font-normal flex-1 text-[11px]">
                  /f/{form.slug}
                </span>
                <div className="flex shrink-0 gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 text-slate-600 hover:text-primary hover:bg-slate-100"
                    title="View Live Form"
                    onClick={() => window.open(`/f/${form.slug}`, "_blank")}
                  >
                    <GlobeIcon className="w-3.5 h-3.5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 text-slate-600 hover:text-emerald-600 hover:bg-slate-100"
                    title="Copy Link"
                    onClick={() => {
                      const url = `${window.location.origin}/f/${form.slug}`;
                      navigator.clipboard.writeText(url);
                      toast.success("Link copied to clipboard!");
                    }}
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="bg-muted/50 p-4 flex justify-between gap-2 border-t">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => router.push(`/builder/${form.id}`)}>
              <SettingsIcon className="w-4 h-4 mr-2" /> Edit
            </Button>
            
            {form.status === "PUBLISHED" ? (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => unpublishForm.mutate({ formId: form.id })}
                disabled={unpublishForm.isPending}
              >
                Unpublish
              </Button>
            ) : (
              <Button 
                variant="default" 
                size="sm" 
                onClick={() => publishForm.mutate({ formId: form.id })}
                disabled={publishForm.isPending || form.status === "ARCHIVED"}
              >
                Publish
              </Button>
            )}
            
            {form.status !== "ARCHIVED" && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => {
                  if (confirm("Are you sure you want to archive this form?")) {
                    archiveForm.mutate({ formId: form.id });
                  }
                }}
                disabled={archiveForm.isPending}
              >
                <Trash2Icon className="w-4 h-4" />
              </Button>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
