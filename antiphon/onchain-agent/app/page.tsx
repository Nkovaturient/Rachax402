import { SiteHeader } from "./components/SiteHeader";
import { LandingHero } from "./components/landing/LandingHero";
import { LandingStats } from "./components/landing/LandingStats";
import { LandingFeatures } from "./components/landing/LandingFeatures";
import { LandingSDGTeaser } from "./components/landing/LandingSDGTeaser";

export default function LandingPage() {
  return (
    <div className="landing-smooth min-h-screen flex flex-col bg-[#000000]">
      <SiteHeader />
      <main className="flex-grow relative">
        <div
          className="pointer-events-none absolute inset-0 dot-grid opacity-40"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 w-[min(90vw,720px)] h-[min(50vh,480px)] rounded-full bg-[#dfff00]/10 blur-[120px]"
          aria-hidden
        />
        <LandingHero />
        <LandingStats />
        <LandingFeatures />
        <LandingSDGTeaser />
      </main>
    </div>
  );
}
