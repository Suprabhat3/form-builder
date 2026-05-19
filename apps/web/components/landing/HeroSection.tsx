import { HeroContent } from "./HeroContent";
import { HeroInteractive } from "./HeroInteractive";

export function HeroSection() {
  return (
    <section className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-14 pt-10 lg:pt-14 pb-10 lg:pb-14 relative overflow-hidden">
      <div className="absolute inset-0 grid-bg-pattern opacity-50 -z-10 pointer-events-none" />

      <div className="grid lg:grid-cols-2 gap-10 items-center relative z-10">
        <HeroContent />
        <HeroInteractive />
      </div>
    </section>
  );
}
