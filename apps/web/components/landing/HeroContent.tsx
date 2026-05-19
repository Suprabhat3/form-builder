export function HeroContent() {
  return (
    <div className="flex flex-col items-start text-left z-20">
      <div className="inline-flex items-center gap-[8px] bg-surface-container-lowest border border-outline-variant/50 rounded-full px-[14px] py-[6px] mb-[32px] soft-focus-shadow">
        <span className="w-2.5 h-2.5 rounded-full bg-primary/70"></span>
        <span className="text-[12px] font-bold text-on-surface-variant uppercase tracking-widest">
          ZENFORM 2.0 IS LIVE
        </span>
      </div>

      <h1 className="text-[40px] sm:text-[56px] lg:text-[64px] xl:text-[72px] font-bold text-on-surface mb-[24px] leading-[1.1] tracking-tight">
        Build Forms That <br />
        <span className="text-primary">Look Like Art.</span>
      </h1>

      <p className="text-[16px] sm:text-[18px] text-on-surface-variant max-w-[500px] mb-[40px] leading-[1.6]">
        Design stunning, high-converting interfaces with effortless precision. Experience a
        sophisticated editor built for professional operators who value clarity and speed over
        complexity.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-[16px] mb-[48px] w-full sm:w-auto">
        <button className="w-full sm:w-auto font-bold bg-primary text-on-primary px-[32px] py-[16px] rounded-lg shadow-[0_8px_20px_0_rgba(70,72,212,0.3)] hover:-translate-y-0.5 transition-all duration-200">
          Start Building Free
        </button>
        <button className="w-full sm:w-auto font-bold bg-surface-container-lowest border border-outline-variant/50 text-on-surface px-[32px] py-[16px] rounded-lg hover:border-primary hover:text-primary transition-all duration-200 flex items-center justify-center gap-[10px]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polygon points="10 8 16 12 10 16 10 8"></polygon>
          </svg>
          View Examples
        </button>
      </div>

      <div className="flex flex-wrap gap-[24px] lg:gap-[32px]">
        <div className="flex items-center gap-[12px]">
          <div className="w-[44px] h-[44px] rounded-[12px] bg-surface-container-lowest border border-outline-variant/40 flex items-center justify-center text-primary soft-focus-shadow">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
          </div>
          <p className="text-[13px] font-semibold text-on-surface leading-[1.3]">
            Beautiful by <br /> Default
          </p>
        </div>

        <div className="flex items-center gap-[12px]">
          <div className="w-[44px] h-[44px] rounded-[12px] bg-surface-container-lowest border border-outline-variant/40 flex items-center justify-center text-primary soft-focus-shadow">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
            </svg>
          </div>
          <p className="text-[13px] font-semibold text-on-surface leading-[1.3]">
            Fast and <br /> Intuitive
          </p>
        </div>

        <div className="flex items-center gap-[12px]">
          <div className="w-[44px] h-[44px] rounded-[12px] bg-surface-container-lowest border border-outline-variant/40 flex items-center justify-center text-primary soft-focus-shadow">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path>
            </svg>
          </div>
          <p className="text-[13px] font-semibold text-on-surface leading-[1.3]">
            Conversion <br /> Focused
          </p>
        </div>
      </div>
    </div>
  );
}
