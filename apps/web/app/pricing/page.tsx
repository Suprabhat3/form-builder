import { TopNavBar } from "~/components/landing/TopNavBar";
import { Footer } from "~/components/landing/Footer";
import { PricingCards } from "~/components/pricing/PricingCards";

export default function PricingPage() {
  return (
    <div className="bg-background text-on-surface font-body-md antialiased min-h-screen flex flex-col relative overflow-x-hidden">
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-15%] left-[-5%] w-[45%] h-[45%] bg-primary-fixed/25 rounded-full blur-[120px]" />
        <div className="absolute top-[30%] right-[-10%] w-[35%] h-[35%] bg-secondary-fixed/25 rounded-full blur-[100px]" />
      </div>

      <TopNavBar />

      <main className="grow relative z-10">
        <section className="max-w-7xl mx-auto px-margin pt-16 pb-8 sm:pt-24 sm:pb-12 text-center">
          <div className="inline-flex items-center gap-2 bg-surface-container border border-outline-variant/30 rounded-full px-4 py-1.5 mb-5 text-primary font-bold text-label-sm uppercase tracking-wider">
            Pricing
          </div>
          <h1 className="text-[40px] sm:text-[56px] font-black tracking-tight text-on-surface leading-[1.05] mb-5">
            Plans that grow with your forms
          </h1>
          <p className="text-body-lg text-on-surface-variant max-w-[42rem] mx-auto leading-relaxed">
            Every account starts with 5 free forms. Upgrade to unlock 10, 20, or 50 forms — billed monthly in INR through Razorpay.
          </p>
        </section>

        <section className="max-w-7xl mx-auto px-margin pb-16 sm:pb-24">
          <PricingCards />

          <div className="mt-14 grid md:grid-cols-3 gap-4">
            {[
              {
                title: "Free forever tier",
                body: "No credit card required. Build up to 5 forms with full theme access and unlimited responses.",
              },
              {
                title: "Instant activation",
                body: "Complete checkout with Razorpay and your higher form limit activates immediately after payment.",
              },
              {
                title: "Monthly flexibility",
                body: "Plans renew every 30 days. When a plan expires, you keep your forms but return to the 5-form free limit for new creations.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-outline-variant/25 bg-surface-container-lowest/70 p-5 backdrop-blur-sm"
              >
                <h2 className="text-base font-bold text-on-surface mb-2">{item.title}</h2>
                <p className="text-sm text-on-surface-variant leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
