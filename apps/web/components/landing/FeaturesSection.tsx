"use client";

import Link from "next/link";
import { useState } from "react";

// Pulled from the templates page — 8 curated themes
type Theme = {
  key: string;
  label: string;
  category: string;
  tagline: string;
  colors: [string, string, string];
  bgClass: string;
  textClass: string;
  emoji: string;
};

const THEMES = [
  {
    key: "movie-noir",
    label: "Movie Noir",
    category: "Movies",
    tagline: "Stark silhouettes & high shadow drama.",
    colors: ["#0a0a0c", "#ffffff", "#ba1a1a"],
    bgClass: "from-zinc-950 via-slate-900 to-black",
    textClass: "text-white",
    emoji: "🎬",
  },
  {
    key: "anime-neon",
    label: "Anime Neon",
    category: "Anime",
    tagline: "Cyberpunk Tokyo nights & neon energy.",
    colors: ["#0b0314", "#ff007f", "#00f0ff"],
    bgClass: "from-purple-950 via-indigo-950 to-violet-950",
    textClass: "text-white",
    emoji: "⚡",
  },
  {
    key: "retro-arcade",
    label: "Retro Arcade",
    category: "Games",
    tagline: "80s console, scanlines & phosphor CRT.",
    colors: ["#0d0d15", "#39ff14", "#f39c12"],
    bgClass: "from-slate-950 via-neutral-900 to-zinc-950",
    textClass: "text-white",
    emoji: "🕹️",
  },
  {
    key: "silicon-minimal",
    label: "Silicon Minimal",
    category: "Tech / SaaS",
    tagline: "Sleek SaaS, dot-blueprint grid & clean shadows.",
    colors: ["#f8fafc", "#0f62fe", "#64748b"],
    bgClass: "from-slate-50 via-slate-100 to-zinc-100",
    textClass: "text-slate-800",
    emoji: "💻",
  },
  {
    key: "terminal-hacker",
    label: "Terminal Hacker",
    category: "OS / Dev",
    tagline: "Green-on-black phosphor for system builders.",
    colors: ["#020202", "#00ff00", "#008800"],
    bgClass: "from-black via-zinc-950 to-neutral-950",
    textClass: "text-white",
    emoji: "💾",
  },
  {
    key: "startup-pitch",
    label: "Startup Pitch",
    category: "Startups",
    tagline: "Organic gradients, pill inputs & YC deck vibes.",
    colors: ["#f5f3ff", "#4f46e5", "#312e81"],
    bgClass: "from-indigo-50 via-purple-50 to-violet-50",
    textClass: "text-indigo-900",
    emoji: "🚀",
  },
  {
    key: "hackathon-rush",
    label: "Hackathon Rush",
    category: "Events",
    tagline: "Brutalist bold yellow & offset press buttons.",
    colors: ["#facc15", "#000000", "#ffffff"],
    bgClass: "from-yellow-400 via-amber-400 to-yellow-500",
    textClass: "text-black",
    emoji: "🏆",
  },
  {
    key: "community-warm",
    label: "Community Warm",
    category: "Communities",
    tagline: "Cozy ivory, leafy greens & eco elements.",
    colors: ["#FAF6F0", "#2e7d32", "#FAF6F0"],
    bgClass: "from-stone-50 via-orange-50 to-amber-50",
    textClass: "text-stone-800",
    emoji: "🌿",
  },
] satisfies [Theme, ...Theme[]];

export function FeaturesSection() {
  // Playground States for Surgical Control Card
  const [borderRadius, setBorderRadius] = useState<"none" | "md" | "2xl">("2xl");
  const [isDark, setIsDark] = useState(false);
  const [paddingSize, setPaddingSize] = useState<"compact" | "cozy">("cozy");
  const [activeTheme, setActiveTheme] = useState<Theme>(THEMES[0]);

  const theme = activeTheme;

  return (
    <section className="max-w-7xl mx-auto px-margin py-[60px] sm:py-[100px] relative">
      {/* Ambient background blur */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* Header */}
      <div className="text-center mb-[64px]">
        <div className="inline-flex items-center gap-[8px] bg-surface-container border border-outline-variant/30 rounded-full px-4 py-1.5 mb-xs text-primary font-bold text-label-sm uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          Engineered for Operators
        </div>
        <h2 className="text-[36px] sm:text-[48px] font-bold text-on-surface mb-md tracking-tight leading-[1.2]">
          Aesthetic by Default
        </h2>
        <p className="text-body-lg text-on-surface-variant max-w-[38rem] mx-auto leading-[1.6]">
          Craft high-converting forms with pixel-perfect control. Skip the styling clutter and leverage our highly optimized token system.
        </p>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-gutter">

        {/* Card 1: Surgical Control (Live Playground!) */}
        <div className="lg:col-span-8 bg-surface-container-lowest dark:bg-surface-container-lowest border border-outline-variant/30 rounded-[32px] p-lg sm:p-xl soft-focus-shadow flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full -z-10 transition-transform duration-500 group-hover:scale-105"></div>

          <div className="flex flex-col sm:flex-row gap-lg items-start mb-xl justify-between">
            <div className="flex-1">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 mb-sm">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
                </svg>
              </div>
              <h3 className="text-headline-md font-bold text-on-surface mb-xs">
                Surgical Precision
              </h3>
              <p className="text-body-md text-on-surface-variant max-w-[28rem] leading-[1.5]">
                Tune spacing, borders, and palettes instantly. Slide or toggle our system settings to see immediate live design updates.
              </p>
            </div>

            {/* Live Controller Panel */}
            <div className="w-full sm:w-auto bg-surface-container/50 border border-outline-variant/30 rounded-2xl p-sm flex flex-col gap-sm shrink-0 min-w-[200px]">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                Live Token Editor
              </span>

              {/* Radius Control */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-on-surface-variant">Radius</label>
                <div className="grid grid-cols-3 gap-xs bg-surface-container-low p-[3px] rounded-lg border border-outline-variant/20">
                  {(["none", "md", "2xl"] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setBorderRadius(r)}
                      className={`text-[10px] font-bold py-1 px-1.5 rounded transition-all capitalize ${
                        borderRadius === r
                          ? "bg-primary text-on-primary shadow-sm"
                          : "text-on-surface-variant hover:text-on-surface"
                      }`}
                    >
                      {r === "none" ? "Flat" : r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Padding Control */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-on-surface-variant">Spacing</label>
                <div className="grid grid-cols-2 gap-xs bg-surface-container-low p-[3px] rounded-lg border border-outline-variant/20">
                  {(["compact", "cozy"] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPaddingSize(p)}
                      className={`text-[10px] font-bold py-1 px-1.5 rounded transition-all capitalize ${
                        paddingSize === p
                          ? "bg-primary text-on-primary shadow-sm"
                          : "text-on-surface-variant hover:text-on-surface"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme Control */}
              <div className="flex items-center justify-between border-t border-outline-variant/20 pt-sm mt-xs">
                <span className="text-[11px] font-semibold text-on-surface-variant">Dark Mode</span>
                <button
                  type="button"
                  onClick={() => setIsDark(!isDark)}
                  className={`w-9 h-5 rounded-full relative cursor-pointer transition-colors duration-200 ${
                    isDark ? "bg-primary" : "bg-outline-variant"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${
                      isDark ? "right-0.5" : "left-0.5"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Form Preview Card */}
          <div className="mt-auto border border-dashed border-outline-variant/50 rounded-2xl p-sm bg-surface-container/20">
            <div
              className={`max-w-[420px] mx-auto border transition-all duration-300 shadow-lg ${
                isDark
                  ? "bg-[#13131a] border-outline/25 text-white"
                  : "bg-white border-outline-variant/30 text-on-surface"
              } ${
                borderRadius === "none"
                  ? "rounded-none"
                  : borderRadius === "md"
                  ? "rounded-xl"
                  : "rounded-[24px]"
              } ${
                paddingSize === "compact" ? "p-md" : "p-lg"
              }`}
            >
              <div className="mb-sm">
                <h4 className="text-[16px] font-bold">Feedback Survey</h4>
                <p className={`text-[11px] ${isDark ? "text-gray-400" : "text-on-surface-variant"}`}>
                  We value your honest opinion.
                </p>
              </div>

              <div className="flex flex-col gap-sm">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold">User Experience Rating</label>
                  <div className="flex gap-xs">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs border border-outline-variant/30 transition-all ${
                          num === 5 ? "bg-primary text-on-primary" : "bg-surface-container/30 hover:border-primary/50"
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold">Comments</label>
                  <input
                    disabled
                    placeholder="Describe your workflow..."
                    className={`h-9 w-full px-3 text-[11px] border border-outline-variant/30 focus:outline-none bg-surface-container/10 ${
                      borderRadius === "none"
                        ? "rounded-none"
                        : borderRadius === "md"
                        ? "rounded-md"
                        : "rounded-lg"
                    }`}
                  />
                </div>

                <button
                  type="button"
                  className={`h-9 w-full bg-primary text-on-primary text-[11px] font-bold shadow-sm transition-all hover:opacity-95 mt-xs ${
                    borderRadius === "none"
                      ? "rounded-none"
                      : borderRadius === "md"
                      ? "rounded-md"
                      : "rounded-lg"
                  }`}
                >
                  Submit Review
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Logic & Flow (Visual Routing simulation) */}
        <div className="lg:col-span-4 bg-surface-container-lowest border border-outline-variant/30 rounded-[32px] p-lg sm:p-xl soft-focus-shadow flex flex-col justify-between overflow-hidden relative group hover-lift">
          <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-gradient-to-bl from-secondary-fixed/5 to-transparent rounded-bl-full -z-10" />

          <div>
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 mb-md">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 0 0-3.7-3.7 48.656 48.656 0 0 0-7.324 0 4.006 4.006 0 0 0-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3-3-3m-9 3-3-3m3 3a9 9 0 1 1-9-9" />
              </svg>
            </div>
            <h3 className="text-label-md font-bold text-on-surface mb-xs uppercase tracking-wider">
              Logic &amp; Flow
            </h3>
            <p className="text-body-md text-on-surface-variant leading-[1.5] mb-md">
              Create advanced branching scenarios effortlessly. Set conditional statements to direct submissions down distinct paths instantly.
            </p>
          </div>

          {/* Visual Node Connection Diagram */}
          <div className="bg-surface-container/40 rounded-2xl border border-outline-variant/30 p-sm flex flex-col gap-sm relative">
            {/* Source Node */}
            <div className="bg-white border border-outline-variant/30 rounded-lg p-2 flex items-center gap-xs shadow-sm w-fit mx-auto relative z-10 transition-transform duration-300 group-hover:scale-[1.03]">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span className="text-[10px] font-semibold">Email matches "@vip.com"</span>
            </div>

            {/* Splitter Line SVG */}
            <div className="w-full h-8 flex justify-center -my-1.5">
              <svg className="w-[120px] h-full" viewBox="0 0 120 32" fill="none">
                <path d="M60 0V8C60 16 30 16 30 24V32" stroke="var(--color-primary)" strokeWidth="1.5" strokeDasharray="3 3" />
                <path d="M60 0V8C60 16 90 16 90 24V32" stroke="var(--color-outline-variant)" strokeWidth="1.5" />
              </svg>
            </div>

            {/* Destination Nodes */}
            <div className="grid grid-cols-2 gap-sm">
              <div className="bg-primary/5 border border-primary/40 rounded-lg p-2 text-center shadow-sm relative z-10 transition-transform duration-300 group-hover:-translate-y-0.5">
                <span className="text-[9px] font-bold text-primary block">True</span>
                <span className="text-[9px] text-on-surface-variant font-medium">VIP Premium Form</span>
              </div>
              <div className="bg-white border border-outline-variant/30 rounded-lg p-2 text-center shadow-sm relative z-10 transition-transform duration-300 group-hover:-translate-y-0.5">
                <span className="text-[9px] font-bold text-on-surface-variant block">False</span>
                <span className="text-[9px] text-on-surface-variant font-medium">Standard Signup</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── NEW Card: Theme Showcase ── */}
        <div className="lg:col-span-12 bg-surface-container-lowest border border-outline-variant/30 rounded-[32px] p-lg sm:p-xl soft-focus-shadow flex flex-col relative overflow-hidden group">
          {/* Ambient glow that shifts with selected theme */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none -z-10 transition-all duration-700 blur-[120px]"
            style={{ background: `linear-gradient(135deg, ${theme.colors[1]}, ${theme.colors[2]})` }}
          />

          {/* Header row */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5">
            <div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 mb-md">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 0 0 5.304 0l6.401-6.402M6.75 21A3.75 3.75 0 0 1 3 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 0 0 3.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008Z" />
                </svg>
              </div>
              <h3 className="text-headline-md font-bold text-on-surface mb-xs">
                8 Stunning Themes, Ready to Ship
              </h3>
              <p className="text-body-md text-on-surface-variant max-w-[44rem] leading-[1.5]">
                From cyberpunk neon to cozy community — every theme is pixel-crafted and instantly deployable. Click any card to preview it live.
              </p>
            </div>
            <Link
              href="/templates"
              className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border border-outline-variant/40 text-on-surface hover:border-primary/40 hover:text-primary bg-surface-container/50 hover:bg-surface-container transition-all duration-200"
            >
              Browse All Themes
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Theme grid — 2 cols mobile, 4 cols sm+ */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {THEMES.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTheme(t)}
                className={[
                  "group/card relative flex flex-col rounded-2xl overflow-hidden border-2 transition-all duration-300 text-left cursor-pointer",
                  activeTheme.key === t.key
                    ? "border-primary shadow-[0_0_0_4px_color-mix(in_srgb,var(--color-primary)_20%,transparent)] scale-[1.02]"
                    : "border-transparent hover:border-outline-variant/50 hover:scale-[1.01]",
                ].join(" ")}
              >
                {/* Gradient preview */}
                <div className={`h-24 sm:h-28 bg-gradient-to-br ${t.bgClass} flex items-center justify-center relative`}>
                  <span className="text-3xl sm:text-2xl drop-shadow-md transition-transform duration-300 group-hover/card:scale-110">
                    {t.emoji}
                  </span>
                  {/* Color swatches bottom strip */}
                  <div className="absolute bottom-0 left-0 right-0 flex h-1.5">
                    {t.colors.map((c, ci) => (
                      <div key={ci} className="flex-1" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  {/* Active indicator */}
                  {activeTheme.key === t.key && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-md">
                      <svg className="w-3 h-3 text-on-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Label */}
                <div className="bg-surface-container-low px-3 py-2 border-t border-outline-variant/20">
                  <p className="text-[11px] font-bold text-on-surface truncate">{t.label}</p>
                  <p className="text-[10px] text-on-surface-variant truncate">{t.category}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Selected theme detail strip */}
          <div className="mt-4 flex flex-col sm:flex-row items-center gap-3 p-4 rounded-2xl border border-outline-variant/25 bg-surface-container/40 backdrop-blur-sm">
            {/* Left: icon + info */}
            <div className="flex items-center gap-3 flex-1 min-w-0 w-full sm:w-auto">
              <div
                className={`shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${theme.bgClass} flex items-center justify-center shadow-lg text-xl sm:text-2xl border border-white/10`}
              >
                {theme.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                  <h4 className="text-sm font-bold text-on-surface">{theme.label}</h4>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                    {theme.category}
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant line-clamp-1">{theme.tagline}</p>
              </div>
            </div>
            {/* Color palette + CTA */}
            <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
              <div className="flex items-center gap-1.5">
                {theme.colors.map((c, idx) => (
                  <div
                    key={idx}
                    title={c}
                    className="w-5 h-5 rounded-full border-2 border-outline-variant/30 shadow-sm transition-transform hover:scale-110"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <Link
                href="/templates"
                className="shrink-0 px-4 py-2 rounded-xl text-xs font-bold bg-primary text-on-primary hover:opacity-90 transition-all shadow-sm whitespace-nowrap"
              >
                Preview Live →
              </Link>
            </div>
          </div>
        </div>

        {/* Card 3: Data Sync (Webhooks / Integrations) */}
        <div className="lg:col-span-5 bg-surface-container-lowest border border-outline-variant/30 rounded-[32px] p-lg sm:p-xl soft-focus-shadow flex flex-col justify-between relative overflow-hidden group hover-lift">
          <div className="absolute inset-0 grid-bg-pattern opacity-30 pointer-events-none -z-10" />

          <div>
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 mb-md">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
              </svg>
            </div>
            <h3 className="text-label-md font-bold text-on-surface mb-xs uppercase tracking-wider">
              Data Routing &amp; Sync
            </h3>
            <p className="text-body-md text-on-surface-variant leading-[1.5] mb-md">
              Broadcast submissions immediately to Slack, Notion, Discord, and customizable webhook endpoints. Keep operations synchronized.
            </p>
          </div>

          {/* Webhook JSON Editor Simulation */}
          <div className="bg-surface-container/60 border border-outline-variant/40 rounded-2xl p-md font-mono text-[10px] text-on-surface-variant relative overflow-hidden transition-all duration-300 group-hover:shadow-md">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-xs mb-xs">
              <div className="flex gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
              </div>
              <span className="text-[9px] uppercase tracking-wider opacity-70">payload.json</span>
            </div>
            <pre className="text-left font-mono leading-[1.4] text-primary">
              {`{\n  "event": "submission.success",\n  "form_id": "form_b2x91a",\n  "data": {\n    "name": "Jane Doe",\n    "email": "jane@example.com"\n  }\n}`}
            </pre>

            {/* Floater integration badges */}
            <div className="absolute right-3 bottom-3 flex flex-wrap gap-xs max-w-[120px] justify-end">
              <span className="px-2 py-0.5 rounded-md bg-white border border-outline-variant/30 text-[9px] font-bold shadow-sm transition-transform duration-300 group-hover:scale-105">Slack</span>
              <span className="px-2 py-0.5 rounded-md bg-white border border-outline-variant/30 text-[9px] font-bold shadow-sm transition-transform duration-300 group-hover:scale-105 group-hover:translate-x-1">Notion</span>
              <span className="px-2 py-0.5 rounded-md bg-white border border-outline-variant/30 text-[9px] font-bold shadow-sm transition-transform duration-300 group-hover:scale-105 group-hover:-translate-y-1">Sheets</span>
            </div>
          </div>
        </div>

        {/* Card 4: Glassmorphic Layering */}
        <div className="lg:col-span-7 bg-surface-container-lowest border border-outline-variant/30 rounded-[32px] p-lg sm:p-xl soft-focus-shadow flex flex-col md:flex-row gap-lg items-center relative overflow-hidden group hover-lift">
          <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-primary/5 rounded-full blur-[80px] -z-10" />

          <div className="flex-1 text-left">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 mb-md">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25" />
              </svg>
            </div>
            <h3 className="text-headline-md font-bold text-on-surface mb-xs">
              3D Glassmorphic Layering
            </h3>
            <p className="text-body-md text-on-surface-variant leading-[1.6]">
              Add immense depth and elegance to layouts. Layer high-end floating panels, aero-light shadows, and blur effects seamlessly.
            </p>
          </div>

          {/* Interactive Layered 3D Perspective Graphic */}
          <div className="w-[200px] h-[200px] relative flex items-center justify-center grow shrink-0 scale-95 md:scale-100 transition-transform duration-500 group-hover:scale-[1.03]">
            {/* Background Glow */}
            <div className="w-24 h-24 bg-primary rounded-full blur-2xl opacity-35 absolute -z-10 animate-pulse" />

            {/* Layer 1 (Bottom Panel) */}
            <div className="w-[140px] h-[100px] bg-white/40 backdrop-blur-md rounded-xl border border-white/30 absolute translate-x-[-15px] translate-y-[20px] rotate-[15deg] shadow-lg transition-transform duration-500 group-hover:translate-x-[-22px] group-hover:translate-y-[28px] flex items-center justify-center">
              <span className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest">Base</span>
            </div>

            {/* Layer 2 (Middle Panel) */}
            <div className="w-[140px] h-[100px] bg-white/60 backdrop-blur-lg rounded-xl border border-white/40 absolute rotate-[15deg] shadow-md transition-transform duration-500 group-hover:translate-y-[2px] flex items-center justify-center">
              <span className="text-[10px] font-bold text-primary/60 uppercase tracking-widest">Aero</span>
            </div>

            {/* Layer 3 (Top Panel) */}
            <div className="w-[140px] h-[100px] bg-primary backdrop-blur-xl rounded-xl border border-white/10 absolute translate-x-[15px] translate-y-[-20px] rotate-[15deg] shadow-2xl transition-transform duration-500 group-hover:translate-x-[22px] group-hover:translate-y-[-28px] flex flex-col justify-between p-xs text-white">
              <div className="h-2 w-8 bg-white/40 rounded-full" />
              <div className="h-6 w-6 bg-white/20 rounded-full flex items-center justify-center mx-auto">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </div>
              <div className="h-2 w-12 bg-white/35 rounded-full ml-auto" />
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
