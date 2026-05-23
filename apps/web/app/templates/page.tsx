"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormRenderer } from "~/components/forms/FormRenderer";
import { TopNavBar } from "~/components/landing/TopNavBar";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { getAuthUser } from "~/lib/auth-session";
import {
  SparklesIcon,
  TvIcon,
  Gamepad2Icon,
  CpuIcon,
  TerminalIcon,
  RocketIcon,
  CompassIcon,
  UsersIcon,
  ArrowLeftIcon,
  SearchIcon,
  PlayIcon,
  CheckCircle2Icon,
  XIcon,
  LucideIcon
} from "lucide-react";

export interface Template {
  key: string;
  label: string;
  category: string;
  tagline: string;
  image: string;
  font: string;
  highlights: string[];
  colors: string[];
  bgClass: string;
}

export interface FormField {
  id: string;
  key: string;
  type: string;
  label: string;
  helperText: string | null;
  placeholder: string | null;
  required: boolean;
  position: number;
  config: Record<string, unknown>;
}

export interface FormDetails {
  id: string;
  title: string;
  description: string | null;
  themeKey: string;
  fields: FormField[];
}

// List of all 8 curated templates
const TEMPLATES: Template[] = [
  {
    key: "movie-noir",
    label: "Movie Noir",
    category: "Movies",
    tagline: "Stark silhouettes, classic serif fonts, and high shadow drama.",
    image: "/movie-noir.png",
    font: "Playfair Display & Georgia",
    highlights: ["Scanline film grain backdrop", "Deep crimson accents", "Flat border stroke style", "Hard offset box drop-shadows"],
    colors: ["#0a0a0c", "#ffffff", "#ba1a1a"],
    bgClass: "from-zinc-950 via-slate-900 to-black",
  },
  {
    key: "anime-neon",
    label: "Anime Neon",
    category: "Anime",
    tagline: "Cyberpunk Tokyo nights with vibrant glows and neon energy.",
    image: "/anime-neon.png",
    font: "Orbitron & Outfit",
    highlights: ["Translucent glassmorphism", "Ambient pink & cyan blur halo", "Neon-cyan input focus glow", "Glow-magenta select elements"],
    colors: ["#0b0314", "#ff007f", "#00f0ff"],
    bgClass: "from-purple-950 via-indigo-950 to-violet-950",
  },
  {
    key: "retro-arcade",
    label: "Retro Arcade",
    category: "Games",
    tagline: "80s vintage console, scanlines, and pixelated styling.",
    image: "/retro-arcade.png",
    font: "Press Start 2P & Fira Code",
    highlights: ["Grid block backdrops", "Phosphor green CRT screens", "Bright yellow borders", "Bouncing arcade thank-you animations"],
    colors: ["#0d0d15", "#39ff14", "#f39c12"],
    bgClass: "from-slate-950 via-neutral-900 to-zinc-950",
  },
  {
    key: "silicon-minimal",
    label: "Silicon Minimal",
    category: "Tech Companies",
    tagline: "Sleek Modern SaaS, clean micro-shadows, and dot-blueprint grid.",
    image: "/silicon-minimal.png",
    font: "Plus Jakarta Sans",
    highlights: ["Subtle grid matrices", "Pure white floating card elements", "Premium blue focus ring halos", "Responsive state lifters"],
    colors: ["#f8fafc", "#0f62fe", "#64748b"],
    bgClass: "from-slate-50 via-slate-100 to-zinc-100",
  },
  {
    key: "terminal-hacker",
    label: "Terminal Hacker",
    category: "Operating Systems",
    tagline: "Green-on-black phosphor terminal for retro system builders.",
    image: "/terminal-hacker.png",
    font: "Fira Code",
    highlights: ["Pitch black screen console", "Prompt symbol prefixes ($ and root)", "Glowing phosphor input grids", "Monospaced submit styling"],
    colors: ["#020202", "#00ff00", "#008800"],
    bgClass: "from-black via-zinc-950 to-neutral-950",
  },
  {
    key: "startup-pitch",
    label: "Startup Pitch",
    category: "Startups",
    tagline: "Sleek YC deck styles with organic gradients and pill inputs.",
    image: "/startup-pitch.png",
    font: "Outfit",
    highlights: ["Warm indigo-to-purple background", "Highly rounded organic pill borders", "Sleek button gradients", "Spinning confetti success screens"],
    colors: ["#f5f3ff", "#4f46e5", "#312e81"],
    bgClass: "from-indigo-50 via-purple-50 to-violet-50",
  },
  {
    key: "hackathon-rush",
    label: "Hackathon Rush",
    category: "Events",
    tagline: "High voltage brutalism, bold yellow, and sticker layouts.",
    image: "/hackathon-rush.png",
    font: "Space Grotesk",
    highlights: ["Saturated yellow canvas", "Bold 3px solid black outlines", "Active offset press buttons", "Asymmetrical rotated card cards"],
    colors: ["#facc15", "#000000", "#ffffff"],
    bgClass: "from-yellow-400 via-amber-400 to-yellow-500",
  },
  {
    key: "community-warm",
    label: "Community Warm",
    category: "Communities",
    tagline: "Cozy eco-friendly gather spaces, soft ivory, and leafy greens.",
    image: "/community-warm.png",
    font: "Lora & Sans-serif",
    highlights: ["Warm cream bases", "Foliage green button shapes", "Eco border elements", "Heart-shaped submissions panels"],
    colors: ["#FAF6F0", "#2e7d32", "#FAF6F0"],
    bgClass: "from-stone-50 via-orange-50/30 to-amber-50/20",
  },
];

export default function TemplatesPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [previewTheme, setPreviewTheme] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    setIsAuthenticated(!!getAuthUser());
  }, []);

  // Filter templates based on category and search
  const filteredTemplates = TEMPLATES.filter((t) => {
    const matchesCategory = selectedCategory === "All" || t.category === selectedCategory;
    const matchesSearch =
      t.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.tagline.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = ["All", ...Array.from(new Set(TEMPLATES.map((t) => t.category)))];

  // Action for clicking "Use Template"
  const handleUseTemplate = (themeKey: string) => {
    if (isAuthenticated) {
      router.push(`/dashboard?theme=${themeKey}`);
    } else {
      router.push(`/signup?theme=${themeKey}`);
    }
  };

  // Mock Form Structure to display in the Interactive Sandbox modal
  const mockForm: FormDetails = {
    id: "mock-sandbox-preview",
    title: `Global Tech Summit Registration`,
    description: `Welcome to the official registration page for the Global Tech Summit. Please fill out your details to secure your spot.`,
    themeKey: previewTheme || "movie-noir",
    fields: [
      {
        id: "m1",
        key: "attendee_name",
        type: "SHORT_TEXT",
        label: "Full Name",
        helperText: "Please enter your name as you'd like it to appear on your badge.",
        placeholder: "e.g. Jane Doe",
        required: true,
        position: 0,
        config: {},
      },
      {
        id: "m2",
        key: "attendee_role",
        type: "SINGLE_SELECT",
        label: "Primary Role",
        helperText: "Select the role that best describes your profession.",
        placeholder: null,
        required: true,
        position: 1,
        config: {
          options: ["Software Engineer", "Product Manager", "Designer", "Founder / Executive", "Other"]
        },
      },
      {
        id: "m3",
        key: "years_experience",
        type: "NUMBER",
        label: "Years of Experience",
        helperText: "How long have you been in the tech industry?",
        placeholder: "e.g. 5",
        required: false,
        position: 2,
        config: { min: 0, max: 50 },
      },
      {
        id: "m4",
        key: "dietary_reqs",
        type: "MULTI_SELECT",
        label: "Dietary Requirements",
        helperText: "We will do our best to accommodate your needs.",
        placeholder: null,
        required: false,
        position: 3,
        config: {
          options: ["Vegetarian", "Vegan", "Gluten-Free", "Nut Allergy", "None"]
        },
      },
      {
        id: "m5",
        key: "newsletter_signup",
        type: "CHECKBOX",
        label: "Keep me updated on future events and news",
        helperText: "You can unsubscribe at any time.",
        placeholder: null,
        required: false,
        position: 4,
        config: {},
      }
    ],
  };

  return (
    <div className="bg-background text-on-surface font-body-md antialiased min-h-screen flex flex-col relative overflow-x-hidden">
      {/* Ambient background decoration */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-15%] w-[60%] h-[40%] bg-primary-fixed/20 rounded-full blur-[140px]" />
        <div className="absolute bottom-[20%] right-[-10%] w-[50%] h-[50%] bg-secondary-fixed/15 rounded-full blur-[130px]" />
      </div>

      <TopNavBar />

      <main className="flex-grow container max-w-7xl mx-auto py-12 px-margin relative z-10">

        {/* Header Title Section */}
        <div className="text-center max-w-2xl mx-auto mb-16 md:mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold mb-6 border border-primary/20 tracking-widest uppercase shadow-sm">
            🎨 Premium Form Skins
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-primary via-indigo-600 to-purple-600 bg-clip-text text-transparent drop-shadow-sm pb-2">
            Choose Form Art, Not Placeholders
          </h1>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed px-4">
            Every form you share is a reflection of your brand. Explore our unauthenticated live preview templates, test input fields, and start building forms in seconds.
          </p>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col md:flex-row gap-6 items-center justify-between mb-16 bg-white/60 backdrop-blur-xl p-5 rounded-3xl border border-slate-200/60 shadow-lg shadow-slate-200/20">
          {/* Search Box */}
          <div className="relative w-full md:w-96 group">
            <SearchIcon className="absolute left-4 top-3.5 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-11 pl-11 pr-4 rounded-2xl border border-slate-200 bg-white/80 text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-inner"
            />
          </div>

          {/* Categories Filter pills */}
          <div className="flex flex-wrap gap-2.5 justify-center">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-5 py-2 rounded-full text-xs font-bold tracking-wide transition-all duration-300 border ${selectedCategory === category
                    ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20 scale-105"
                    : "bg-white/80 hover:bg-slate-50 hover:scale-105 text-slate-600 border-slate-200 hover:border-slate-300 shadow-sm"
                  }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Catalog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
          {filteredTemplates.map((template) => {
            return (
              <Card
                key={template.key}
                className="group flex flex-col overflow-hidden border-slate-200/60 bg-white/80 hover:bg-white backdrop-blur-md transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/30"
              >
                {/* 16:9 Image Header */}
                <div className="relative w-full aspect-video overflow-hidden border-b border-slate-100">
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors z-10" />
                  <img
                    src={template.image}
                    alt={template.label}
                    className="w-full h-full object-fill group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute bottom-2 right-2 z-20">
                    {/* <span className="text-[10px] font-bold uppercase tracking-widest text-white bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/20">
                      {template.category}
                    </span> */}
                  </div>
                </div>

                <CardHeader className="pb-4 pt-5">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] font-mono text-muted-foreground bg-slate-100 px-2 py-0.5 rounded">
                      {template.font.split(" ")[0]}
                    </span>
                  </div>
                  <CardTitle className="text-xl font-bold text-slate-800">{template.label}</CardTitle>
                  <CardDescription className="text-xs text-slate-500 leading-relaxed mt-1">
                    {template.tagline}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-1 pb-4">
                  {/* Style characteristics */}
                  <div className="space-y-1.5 mb-5 text-xs text-slate-600">
                    {template.highlights.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-1.5">
                        <CheckCircle2Icon className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>

                  {/* Color Swatches Palette */}
                  <div className="border-t pt-4">
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Palette Colors</div>
                    <div className="flex gap-2">
                      {template.colors.map((color, idx) => (
                        <div key={idx} className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                          <div
                            className="w-3 h-3 rounded-full border border-slate-300 shadow-inner shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-[9px] font-mono text-slate-500 uppercase">{color}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="p-5 bg-slate-50/80 border-t flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewTheme(template.key)}
                    className="flex-1 hover:bg-slate-100 border-slate-200 text-xs font-semibold gap-1.5"
                  >
                    <PlayIcon className="w-3 h-3 fill-current text-primary" />
                    Preview Live
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleUseTemplate(template.key)}
                    className="flex-1 bg-primary hover:bg-primary/95 text-xs font-bold"
                  >
                    Use Theme
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Empty state when search matches nothing */}
        {filteredTemplates.length === 0 && (
          <div className="text-center py-16 bg-white/40 border border-dashed rounded-2xl max-w-md mx-auto">
            <UsersIcon className="w-12 h-12 text-muted-foreground mx-auto opacity-30 mb-3" />
            <h3 className="font-bold text-slate-700">No templates found</h3>
            <p className="text-xs text-muted-foreground mt-1">Try modifying your search or select another category.</p>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="border-t bg-white/50 backdrop-blur-md py-8 mt-24">
        <div className="container max-w-7xl mx-auto px-margin text-center text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} ZenForm. Designed with visual excellence.</p>
        </div>
      </footer>

      {/* INTERACTIVE PLAYGROUND MODAL OVERLAY */}
      {previewTheme && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end sm:justify-center items-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl bg-background rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[100vh] sm:max-h-[90vh] overflow-hidden border border-border animate-in slide-in-from-bottom-6 duration-300">

            {/* Modal Header Panel */}
            <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 text-foreground px-6 py-4 flex items-center justify-between shrink-0 border-b border-border z-10 relative">
              <div className="flex items-center gap-3">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <div>
                  <h3 className="font-bold text-sm leading-none flex items-center gap-2">
                    {TEMPLATES.find((t) => t.key === previewTheme)?.label} Preview
                  </h3>
                  <p className="text-[10px] text-muted-foreground mt-1 font-mono uppercase">
                    Live Form Example
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="bg-primary hover:bg-primary/95 text-xs text-primary-foreground font-bold h-8 px-4"
                  onClick={() => {
                    const theme = previewTheme;
                    setPreviewTheme(null);
                    handleUseTemplate(theme);
                  }}
                >
                  Use This Theme
                </Button>
                <button
                  onClick={() => setPreviewTheme(null)}
                  className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 text-foreground flex items-center justify-center border border-border hover:scale-105 active:scale-95 transition-all"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable sandbox environment */}
            <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] relative bg-background">
              <div className="select-none">
                <FormRenderer form={mockForm} isPreview={true} />
              </div>
            </div>

            {/* Bottom alert bar */}
            <div className="bg-muted/50 backdrop-blur border-t border-border px-6 py-3 text-center text-[11px] text-muted-foreground shrink-0 relative z-10">
              Preview Mode: Your submission will not be saved.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
