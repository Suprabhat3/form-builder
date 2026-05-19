"use client";

import { useEffect, useRef, useState } from "react";

const BASE_W = 960;
const BASE_H = 640;

const BASIC_FIELDS = [
  { icon: "M4 6h16M4 12h16M4 18h7", name: "Short Text" },
  {
    icon: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6",
    name: "Email",
  },
  { icon: "M6 9l6 6 6-6", name: "Dropdown" },
  {
    icon: "M9 11l3 3L22 4 M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11",
    name: "Multi Select",
  },
  { icon: "M4 9h16 M4 15h16 M10 3L8 21 M16 3l-2 18", name: "Number" },
  {
    icon: "M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z M16 2v4 M8 2v4 M3 10h18",
    name: "Date",
  },
];

const ADVANCED_FIELDS = [
  {
    icon: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M17 8l-5-5-5 5 M12 3v12",
    name: "File Upload",
  },
  { icon: "M3 17l6-6 4 4 8-8 M14 7h7v7", name: "Signature" },
];

const THEMES = [
  { name: "primary", color: "#4648d4" },
  { name: "blue", color: "#53b1fd" },
  { name: "green", color: "#34d399" },
  { name: "amber", color: "#fbbf24" },
];

export function HeroInteractive() {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [project, setProject] = useState("");
  const [message, setMessage] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [theme, setTheme] = useState(THEMES[0]?.color);
  const [actionOn, setActionOn] = useState(true);
  const [activeTab, setActiveTab] = useState<"Fields" | "Style">("Fields");
  const [activeRightTab, setActiveRightTab] = useState<"Style" | "Advanced">("Style");

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth;
      setScale(Math.min(1, w / BASE_W));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="relative w-full flex items-center justify-center lg:justify-end mt-8 lg:mt-0 z-10">
      {/* Scaling wrapper — measures its own width and scales the fixed-size mockup to fit */}
      <div ref={wrapRef} className="relative w-full" style={{ height: BASE_H * scale }}>
        <div
          className="absolute top-0 left-0"
          style={{
            width: BASE_W,
            height: BASE_H,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          {/* Soft background glow behind the editor */}
          <div
            aria-hidden
            className="absolute inset-0 rounded-[28px] pointer-events-none transition-all duration-500"
            style={{
              background: `radial-gradient(60% 60% at 50% 50%, ${theme}47 0%, ${theme}1F 45%, transparent 75%)`,
              filter: "blur(40px)",
              transform: "scale(1.04)",
              zIndex: 0,
            }}
          />

          {/* Animated moving border glow */}
          <div className="absolute -inset-[2px] rounded-[26px] overflow-hidden z-0 pointer-events-none">
            <div
              className="absolute top-1/2 left-1/2 w-[150%] h-[150%] -translate-x-1/2 -translate-y-1/2 animate-spin"
              style={{
                animationDuration: "4s",
                background: `conic-gradient(from 0deg, transparent 70%, ${theme} 100%)`,
              }}
            />
          </div>

          {/* Editor window */}
          <div 
            className="relative z-10 w-[960px] h-[640px] bg-white rounded-[24px] border border-outline-variant/20 flex flex-col overflow-hidden transition-all duration-500"
            style={{
              boxShadow: `0 30px 80px ${theme}26`,
            }}
          >
            {/* Topbar */}
            <div className="h-[56px] border-b border-outline-variant/20 flex items-center justify-between px-6 bg-white shrink-0">
              <div className="w-8 h-8 rounded-full" style={{ background: theme, opacity: 0.2 }} />

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="px-5 py-2 rounded-lg border border-outline-variant/30 text-xs font-semibold text-on-surface hover:bg-gray-50"
                >
                  Preview
                </button>
                <button
                  type="button"
                  className="px-5 py-2 rounded-lg text-white text-xs font-semibold hover:opacity-90 transition-opacity"
                  style={{ background: theme }}
                >
                  Publish
                </button>
              </div>
            </div>

            <div className="flex flex-1 overflow-hidden bg-[#fafafa]">
              {/* Left sidebar */}
              <div className="w-[220px] bg-white border-r border-outline-variant/20 p-5 flex flex-col gap-5 shrink-0">
                <div className="flex gap-6 border-b border-outline-variant/20 pb-0">
                  {(["Fields", "Style"] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`text-xs font-bold pb-3 ${activeTab === tab ? "border-b-2" : "text-on-surface-variant"}`}
                      style={activeTab === tab ? { color: theme, borderColor: theme } : undefined}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <div className="text-[10px] font-bold text-on-surface-variant/70 uppercase tracking-wider mt-2">
                  Basic Fields
                </div>
                <div className="flex flex-col gap-2">
                  {BASIC_FIELDS.map((field, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-outline-variant/30 bg-white shadow-[0_2px_4px_rgba(0,0,0,0.02)] cursor-grab hover:border-primary/40 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="text-on-surface-variant"
                        >
                          <path d={field.icon} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className="text-xs font-semibold text-on-surface">{field.name}</span>
                      </div>
                      <span className="text-outline-variant text-[10px]">⋮⋮</span>
                    </div>
                  ))}
                </div>
                <div className="text-[10px] font-bold text-on-surface-variant/70 uppercase tracking-wider mt-2">
                  Advanced Fields
                </div>
                <div className="flex flex-col gap-2">
                  {ADVANCED_FIELDS.map((field, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-outline-variant/30 bg-white shadow-[0_2px_4px_rgba(0,0,0,0.02)] cursor-grab hover:border-primary/40 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="text-on-surface-variant"
                        >
                          <path d={field.icon} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className="text-xs font-semibold text-on-surface">{field.name}</span>
                      </div>
                      <span className="text-outline-variant text-[10px]">⋮⋮</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Center canvas */}
              <div className="flex-1 p-8 overflow-hidden flex justify-center bg-[#f8f9fc]">
                <div className="w-full max-w-[440px] h-fit bg-white rounded-2xl shadow-sm border border-outline-variant/20 p-8 flex flex-col gap-6 relative">
                  <div>
                    <h2 className="text-[22px] font-bold text-on-surface mb-2">
                      Start Your Project
                    </h2>
                    <p className="text-[13px] text-on-surface-variant">
                      We'll get back to you within 24 hours.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[12px] font-semibold text-on-surface">Full Name</label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      className="h-11 w-full rounded-lg border border-outline-variant/40 bg-gray-50/50 px-4 text-[13px] text-on-surface placeholder:text-gray-400 focus:outline-none focus:border-primary focus:bg-white"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[12px] font-semibold text-on-surface">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="h-11 w-full rounded-lg border border-outline-variant/40 bg-gray-50/50 px-4 text-[13px] text-on-surface placeholder:text-gray-400 focus:outline-none focus:border-primary focus:bg-white"
                    />
                  </div>

                  <div className="flex flex-col gap-2 relative">
                    <label className="text-[12px] font-semibold text-on-surface">
                      Project Type
                    </label>
                    <button
                      type="button"
                      onClick={() => setDropdownOpen((v) => !v)}
                      className="h-11 w-full rounded-lg border border-outline-variant/40 bg-gray-50/50 flex items-center justify-between px-4 hover:border-primary/40"
                    >
                      <span
                        className={`text-[13px] ${project ? "text-on-surface" : "text-gray-400"}`}
                      >
                        {project || "Select an option"}
                      </span>
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className={`text-on-surface-variant transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                    {dropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-outline-variant/30 rounded-lg shadow-lg z-30 overflow-hidden">
                        {["Website", "Mobile App", "Branding", "Other"].map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => {
                              setProject(opt);
                              setDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 text-[13px] text-on-surface hover:bg-gray-50"
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 relative group">
                    <label className="text-[12px] font-semibold" style={{ color: theme }}>
                      Tell us about your project
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type your message here..."
                      className="h-[100px] w-full rounded-lg border-[2px] bg-white p-4 text-[13px] text-on-surface placeholder:text-gray-400 resize-none focus:outline-none"
                      style={{ borderColor: `${theme}80`, boxShadow: `0 0 0 4px ${theme}14` }}
                    />
                    <div className="absolute -right-[18px] top-1/2 -translate-y-1/2 w-9 h-9 bg-white rounded-lg shadow-lg border border-outline-variant/30 flex items-center justify-center cursor-move">
                      <div className="grid grid-cols-2 gap-[3px]">
                        {[...Array(6)].map((_, i) => (
                          <span
                            key={i}
                            className="w-[3px] h-[3px] rounded-full"
                            style={{ background: theme }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {actionOn && (
                    <button
                      type="button"
                      className="mt-2 w-[140px] h-11 text-white text-[13px] font-bold rounded-lg shadow-[0_4px_14px_rgba(70,72,212,0.3)] hover:opacity-90 transition-opacity"
                      style={{ background: theme }}
                    >
                      Submit Form
                    </button>
                  )}
                </div>
              </div>

              {/* Right sidebar */}
              <div className="w-[240px] bg-white border-l border-outline-variant/20 p-5 flex flex-col gap-6 shrink-0">
                <div className="flex gap-6 border-b border-outline-variant/20 pb-0">
                  {(["Style", "Advanced"] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveRightTab(tab)}
                      className={`text-xs font-bold pb-3 ${activeRightTab === tab ? "border-b-2" : "text-on-surface-variant"}`}
                      style={
                        activeRightTab === tab ? { color: theme, borderColor: theme } : undefined
                      }
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col gap-3">
                  <span className="text-[10px] font-bold text-on-surface-variant/70 uppercase tracking-wider">
                    Theme
                  </span>
                  <div className="flex gap-2">
                    {THEMES.map((t) => (
                      <button
                        key={t.color}
                        type="button"
                        onClick={() => setTheme(t.color)}
                        className={`w-7 h-7 rounded-lg ${theme === t.color ? "ring-2 ring-offset-2" : ""}`}
                        style={{
                          background: t.color,
                          ...(theme === t.color ? { boxShadow: `0 0 0 2px ${t.color}` } : {}),
                        }}
                        aria-label={t.name}
                      />
                    ))}
                    <button
                      type="button"
                      className="w-7 h-7 rounded-lg border border-outline-variant/40 flex items-center justify-center text-on-surface-variant text-lg font-light bg-gray-50 hover:bg-gray-100"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <span className="text-[10px] font-bold text-on-surface-variant/70 uppercase tracking-wider">
                    Font
                  </span>
                  <div className="h-10 rounded-lg border border-outline-variant/40 flex items-center justify-between px-3 bg-gray-50/50">
                    <span className="text-xs font-semibold text-on-surface">Inter</span>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-on-surface-variant"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <span className="text-[10px] font-bold text-on-surface-variant/70 uppercase tracking-wider">
                    Radius
                  </span>
                  <div className="h-10 rounded-lg border border-outline-variant/40 flex items-center justify-between px-3 bg-gray-50/50">
                    <span className="text-xs font-semibold text-on-surface">Large</span>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-on-surface-variant"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] font-bold text-on-surface-variant/70 uppercase tracking-wider">
                    Action Button
                  </span>
                  <button
                    type="button"
                    onClick={() => setActionOn((v) => !v)}
                    className="w-10 h-5 rounded-full relative cursor-pointer transition-colors"
                    style={{ background: actionOn ? theme : "#d1d5db" }}
                    aria-pressed={actionOn}
                  >
                    <div
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${actionOn ? "right-0.5" : "left-0.5"}`}
                    />
                  </button>
                </div>

                <div className="flex flex-col gap-3 mt-2">
                  <span className="text-[10px] font-bold text-on-surface-variant/70 uppercase tracking-wider">
                    Background
                  </span>
                  <div className="h-10 rounded-lg border border-outline-variant/40 flex items-center px-3 bg-gray-50/50 gap-3">
                    <div className="w-5 h-5 rounded" style={{ background: theme }} />
                    <span className="text-xs font-semibold text-on-surface uppercase">{theme}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <span className="text-[10px] font-bold text-on-surface-variant/70 uppercase tracking-wider">
                    Text
                  </span>
                  <div className="h-10 rounded-lg border border-outline-variant/40 flex items-center px-3 bg-gray-50/50 gap-3">
                    <div className="w-5 h-5 rounded bg-white border border-outline-variant/40" />
                    <span className="text-xs font-semibold text-on-surface">#FFFFFF</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
