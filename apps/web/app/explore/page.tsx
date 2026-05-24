"use client";

import { trpc } from "~/trpc/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { SparklesIcon, GlobeIcon, ArrowRightIcon } from "lucide-react";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "~/components/ui/empty";

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

export default function ExplorePage() {
  const { data: forms, isLoading } = trpc.form.listPublic.useQuery(undefined, {
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <GlobeIcon className="h-3.5 w-3.5" />
            Explore public forms
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">
              Discover what creators are building
            </h1>
            <p className="max-w-2xl text-base text-slate-600">
              Browse published, public forms that are open for responses. Each design shows off a unique theme.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        {isLoading ? (
          <div className="text-slate-500">Loading public forms...</div>
        ) : !forms || forms.length === 0 ? (
          <Empty className="border-slate-200">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <SparklesIcon className="h-5 w-5" />
              </EmptyMedia>
              <EmptyTitle>No public forms yet</EmptyTitle>
              <EmptyDescription>
                Publish your first form as public to appear in this showcase.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button onClick={() => (window.location.href = "/dashboard")}>Create a form</Button>
            </EmptyContent>
          </Empty>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {forms.map((form) => {
              const meta = themeMetadata[form.themeKey] || {
                bg: "#ffffff",
                primary: "#0f172a",
                secondary: "#e2e8f0",
                desc: "",
              };

              return (
                <Card key={form.id} className="group overflow-hidden border-slate-200 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
                  <div className="relative h-36 overflow-hidden" style={{ backgroundColor: meta.bg }}>
                    <div className="absolute inset-0 opacity-30" style={{ background: `linear-gradient(140deg, ${meta.primary}, transparent)` }} />
                    <div className="relative z-10 space-y-2 px-4 pt-4">
                      <div className="h-3 w-1/2 rounded" style={{ backgroundColor: meta.primary }} />
                      <div className="h-8 w-full rounded border" style={{ borderColor: meta.secondary }} />
                      <div className="h-7 w-2/3 rounded-full" style={{ backgroundColor: meta.primary }} />
                    </div>
                  </div>
                  <CardHeader className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-[10px] uppercase tracking-widest">
                        Public
                      </Badge>
                      <span className="text-xs text-slate-500">{form.responseCount} responses</span>
                    </div>
                    <div>
                      <CardTitle className="line-clamp-1 text-lg text-slate-900">
                        {form.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-2 text-xs">
                        {form.description || meta.desc}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button
                      className="w-full gap-2 bg-slate-900 text-white hover:bg-slate-800"
                      onClick={() => window.open(`/f/${form.slug}`, "_blank")}
                    >
                      Open form
                      <ArrowRightIcon className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
