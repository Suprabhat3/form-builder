import Image from "next/image";

export function HeroSection() {
  return (
    <section className="max-w-7xl mx-auto px-margin pt-[120px] pb-xl flex flex-col items-center text-center relative">
      <div className="inline-flex items-center gap-xs bg-surface-container-lowest border border-outline-variant/50 rounded-full px-sm py-1 mb-lg soft-focus-shadow">
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
        <span className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-widest">
          ZenForm 2.0 is live
        </span>
      </div>
      <h1 className="text-headline-lg-mobile font-headline-lg-mobile md:text-display-lg md:font-display-lg text-on-surface max-w-4xl mx-auto mb-md leading-tight">
        Build Forms That <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-container">
          Look Like Art.
        </span>
      </h1>
      <p className="text-body-lg font-body-lg text-on-surface-variant max-w-2xl mx-auto mb-xl leading-relaxed">
        Design stunning, high-converting interfaces with effortless precision. Experience a
        sophisticated editor built for professional operators who value clarity and speed over
        complexity.
      </p>
      <div className="flex flex-col sm:flex-row items-center gap-md mb-[80px]">
        <button className="w-full sm:w-auto text-label-md font-label-md bg-gradient-to-r from-primary to-primary-container text-on-primary px-xl py-sm rounded-lg shadow-[0_4px_14px_0_rgba(70,72,212,0.39)] hover:shadow-[0_6px_20px_rgba(70,72,212,0.23)] hover:-translate-y-0.5 transition-all duration-200">
          Start Building Free
        </button>
        <button className="w-full sm:w-auto text-label-md font-label-md bg-surface-container-lowest border border-outline-variant/50 text-on-surface px-xl py-sm rounded-lg hover:border-primary hover:text-primary transition-all duration-200 flex items-center justify-center gap-xs">
          <span className="material-symbols-outlined text-[18px]">play_circle</span>
          View Examples
        </button>
      </div>
      {/* Product Preview Hero Image */}
      <div className="w-full max-w-5xl mx-auto relative rounded-2xl p-2 bg-surface-container-low/50 backdrop-blur-sm border border-outline-variant/20 shadow-2xl">
        <div
          className="absolute inset-0 bg-gradient-to-b from-transparent to-background/90 z-10 pointer-events-none rounded-2xl"
          style={{ top: "60%" }}
        ></div>
        <img
          alt="ZenForm Editor Interface"
          className="w-full h-auto rounded-xl border border-outline-variant/30 object-cover relative z-0"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBGiKCxYcOA7AmXqu7PPcj7krSzsBaHKXVnwh7MQ7MkRPJz-A1ZQqCKTS8xErTq9m_fwl_Wf-xZCMe0kM0TU0QHI2dSBtwRBTe_XoYRubBwesbetM3NwkbQAbR4VBrVJpg4zNbAknjHKy03QGgg2zZLZX5SD2ClQaz6X5QFQgySQI3BUsi0AMuPPmDKzip6mG3dnk_CWVesO5grRnlf_xY7QbWljCDPLlZDC6iyWDDunp65bIfa9Gss9UPh0MqBaivRCCKJZG64Mo4"
        />
      </div>
    </section>
  );
}
