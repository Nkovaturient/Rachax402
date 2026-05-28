import { SiteHeader } from "./components/SiteHeader";
import { LandingHero } from "./components/landing/LandingHero";
import { LandingStats } from "./components/landing/LandingStats";
import { LandingFeatures } from "./components/landing/LandingFeatures";
import { LandingSDGTeaser } from "./components/landing/LandingSDGTeaser";

export default function LandingPage() {
  return (
    <div className="landing-smooth min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-grow relative">
        <LandingHero />
        <LandingStats />
        <LandingFeatures />
        <LandingSDGTeaser />
      </main>
    </div>
  );
}
