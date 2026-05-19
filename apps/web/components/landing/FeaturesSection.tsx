export function FeaturesSection() {
  return (
    <section className="max-w-7xl mx-auto px-margin py-[120px] relative">
      <div className="text-center mb-xl">
        <h2 className="text-headline-lg font-headline-lg text-on-surface mb-xs">
          Aesthetic by Default
        </h2>
        <p className="text-body-md font-body-md text-on-surface-variant max-w-[36rem] mx-auto">
          Engineered to produce pixel-perfect results instantly. No more
          wrestling with clunky styling panels.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
        {/* Large Feature Card 1 */}
        <div className="md:col-span-8 bg-surface-container-lowest rounded-2xl border border-outline-variant/40 p-lg soft-focus-shadow hover-lift flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-fixed/20 rounded-bl-full -z-10 transition-transform group-hover:scale-110 duration-500"></div>
          <div className="flex items-start gap-md mb-xl">
            <div className="w-12 h-12 rounded-xl bg-surface-container-low flex items-center justify-center border border-outline-variant/30 text-primary">
              <span className="material-symbols-outlined text-[24px]">
                tune
              </span>
            </div>
            <div>
              <h3 className="text-headline-md font-headline-md text-on-surface mb-xs">
                Surgical Control
              </h3>
              <p className="text-body-md font-body-md text-on-surface-variant max-w-[28rem]">
                Manipulate spacing, typography, and color with absolute
                precision using our unified token system.
              </p>
            </div>
          </div>
          {/* Abstract UI Representation */}
          <div className="mt-auto pt-md border-t border-outline-variant/20 flex gap-sm opacity-80">
            <div className="h-8 w-24 bg-surface-container-high rounded border border-outline-variant/30"></div>
            <div className="h-8 w-32 bg-primary-fixed rounded border border-primary/20"></div>
            <div className="h-8 w-16 bg-surface-container-high rounded border border-outline-variant/30"></div>
          </div>
        </div>
        {/* Small Feature Card 1 */}
        <div className="md:col-span-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/40 p-lg soft-focus-shadow hover-lift flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center border border-outline-variant/30 text-primary mb-md">
              <span className="material-symbols-outlined text-[20px]">
                bolt
              </span>
            </div>
            <h3 className="text-label-md font-label-md text-on-surface mb-xs uppercase tracking-wider">
              Logic &amp; Flow
            </h3>
            <p className="text-body-md font-body-md text-on-surface-variant">
              Build complex branching paths without touching a single line of
              code. Visual routing made intuitive.
            </p>
          </div>
        </div>
        {/* Small Feature Card 2 */}
        <div className="md:col-span-5 bg-surface-container-lowest rounded-2xl border border-outline-variant/40 p-lg soft-focus-shadow hover-lift flex flex-col justify-between relative overflow-hidden">
          <div className="grid-bg-pattern absolute inset-0 opacity-50 pointer-events-none z-0"></div>
          <div className="relative z-10">
            <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center border border-outline-variant/30 text-primary mb-md">
              <span className="material-symbols-outlined text-[20px]">
                hub
              </span>
            </div>
            <h3 className="text-label-md font-label-md text-on-surface mb-xs uppercase tracking-wider">
              Data Sync
            </h3>
            <p className="text-body-md font-body-md text-on-surface-variant">
              Seamlessly route submissions to your existing stack in real-time.
            </p>
          </div>
        </div>
        {/* Large Feature Card 2 */}
        <div className="md:col-span-7 bg-surface-container-lowest rounded-2xl border border-outline-variant/40 p-lg soft-focus-shadow hover-lift flex flex-col lg:flex-row gap-lg items-center">
          <div className="flex-1">
            <h3 className="text-headline-md font-headline-md text-on-surface mb-xs">
              Glassmorphic Elegance
            </h3>
            <p className="text-body-md font-body-md text-on-surface-variant">
              Employ high-end UI patterns instantly. Add depth with soft-focus
              shadows and aero-light layering.
            </p>
          </div>
          <div className="w-full lg:w-48 h-48 glass-panel rounded-xl flex items-center justify-center relative shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/10 rounded-xl"></div>
            <div className="w-16 h-16 bg-primary rounded-full blur-xl opacity-20 absolute"></div>
            <span
              className="material-symbols-outlined text-primary text-[48px] relative z-10"
              style={{ fontVariationSettings: "'wght' 200" }}
            >
              view_in_ar
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
