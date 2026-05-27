import { PricingCards } from "~/components/pricing/PricingCards";

export function PricingSection() {
  return (
    <section id="pricing" className="max-w-7xl mx-auto px-margin py-[60px] sm:py-[100px] relative scroll-mt-24">
      <div className="absolute top-1/4 right-0 w-[420px] h-[420px] bg-secondary-fixed/20 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-0 w-[360px] h-[360px] bg-primary-fixed/15 rounded-full blur-[100px] pointer-events-none -z-10" />

      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-surface-container border border-outline-variant/30 rounded-full px-4 py-1.5 mb-4 text-primary font-bold text-label-sm uppercase tracking-wider">
          Simple, transparent pricing
        </div>
        <h2 className="text-[36px] sm:text-[48px] font-bold text-on-surface mb-4 tracking-tight leading-[1.15]">
          Start free. Scale when you&apos;re ready.
        </h2>
        <p className="text-body-lg text-on-surface-variant max-w-[40rem] mx-auto leading-relaxed">
          Create up to 5 forms for free. Unlock 10, 20, or 50 forms with affordable monthly plans powered by Razorpay.
        </p>
      </div>

      <PricingCards compact />

      <p className="text-center text-sm text-on-surface-variant mt-8">
        All paid plans renew monthly. Secure payments via Razorpay. Cancel anytime — your forms stay safe.
      </p>
    </section>
  );
}
