import { TopNavBar } from "~/components/landing/TopNavBar";
import { HeroSection } from "~/components/landing/HeroSection";
import { FeaturesSection } from "~/components/landing/FeaturesSection";
import { CTASection } from "~/components/landing/CTASection";
import { Footer } from "~/components/landing/Footer";

export default function Home() {
  return (
    <div className="bg-background text-on-surface font-body-md antialiased min-h-screen flex flex-col relative overflow-x-hidden">
      {/* Ambient Background Elements */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary-fixed/30 rounded-full blur-[120px]"></div>
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-secondary-fixed/30 rounded-full blur-[100px]"></div>
      </div>

      <TopNavBar />
      
      {/* Main Content Canvas */}
      <main className="flex-grow relative z-10">
        <HeroSection />
        <FeaturesSection />
        <CTASection />
      </main>

      <Footer />
    </div>
  );
}
