import Link from "next/link";

const STATS = [
  { value: "8", label: "Unique Themes" },
  { value: "∞", label: "Custom Fields" },
  { value: "4+", label: "Integrations" },
  { value: "Free", label: "To Get Started" },
];

export function CTASection() {
  return (
    <section className="max-w-5xl mx-auto px-margin py-12 sm:py-ds-xl mb-[60px] sm:mb-[100px] relative">
      {/* Dynamic ambient float glow behind the container */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] bg-gradient-to-tr from-primary/10 via-purple-600/5 to-transparent rounded-[40px] blur-3xl -z-10 pointer-events-none" />

      <div className="bg-surface-container-lowest border border-outline-variant/35 rounded-[32px] overflow-hidden shadow-[0_20px_50px_rgba(70,72,212,0.06)] relative">
        {/* Decorative elements */}
        <div className="absolute inset-0 grid-bg-pattern opacity-25 pointer-events-none" />
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-primary/10 rounded-full blur-[90px] pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-secondary-fixed-dim/20 rounded-full blur-[90px] pointer-events-none" />

        {/* Stats bar */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 border-b border-outline-variant/20">
          {STATS.map((stat, i) => (
            <div
              key={i}
              className={[
                "flex flex-col items-center justify-center py-5 px-4 gap-0.5",
                i < STATS.length - 1 ? "border-r border-outline-variant/20" : "",
              ].join(" ")}
            >
              <span className="text-2xl font-extrabold text-on-surface tracking-tight leading-none">
                {stat.value}
              </span>
              <span className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">
                {stat.label}
              </span>
            </div>
          ))}
        </div>

        {/* Main CTA content */}
        <div className="p-8 sm:p-[64px] text-center relative z-10 flex flex-col items-center">
          <span className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-[11px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full mb-ds-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Instant Deployment
          </span>

          <h2 className="text-[32px] sm:text-[52px] font-bold text-on-surface mb-ds-md tracking-tight leading-[1.15] max-w-3xl text-center text-balance">
            Ready for{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary-container to-purple-600 whitespace-nowrap">
              Effortless Precision?
            </span>
          </h2>

          <p className="text-body-md sm:text-body-lg text-on-surface-variant max-w-2xl mx-auto mb-ds-xl leading-[1.6]">
            Join the forward-thinking operators who have upgraded their form workflow. Stop fighting clunky default layouts and start creating stunning, high-converting digital interfaces in minutes.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-ds-md w-full sm:w-auto">
            <Link
              href="/dashboard"
              className="group relative w-full sm:w-auto text-label-md font-label-md bg-gradient-to-r from-primary to-primary-container text-on-primary px-ds-xl py-4 rounded-xl shadow-[0_8px_24px_rgba(70,72,212,0.25)] hover:shadow-[0_12px_32px_rgba(70,72,212,0.35)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 inline-block text-center overflow-hidden"
            >
              <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/10" />
              <span className="relative">Create Your First Form →</span>
            </Link>
            <Link
              href="/templates"
              className="w-full sm:w-auto text-label-md font-medium text-on-surface-variant border border-outline-variant/40 hover:border-primary/40 hover:text-primary px-ds-xl py-4 rounded-xl transition-all duration-200 inline-block text-center hover:-translate-y-0.5 bg-surface-container/40 hover:bg-surface-container"
            >
              Explore Themes
            </Link>
          </div>

          <p className="text-label-sm text-on-surface-variant flex items-center gap-1.5 mt-ds-md">
            <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            No credit card required. Free forever on the starter plan.
          </p>
        </div>
      </div>
    </section>
  );
}
