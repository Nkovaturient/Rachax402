import Link from "next/link";
import { CoordinationMesh } from "./CoordinationMesh";

export function LandingHero() {
  return (
    <section className="relative min-h-[88vh] flex flex-col justify-center px-4 sm:px-6 pt-20 pb-20 overflow-hidden">
      <div className="hero-spotlight" aria-hidden />

      <div className="max-w-6xl mx-auto w-full relative z-10 grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
        <div className="hero-glass-panel glass-prism text-center lg:text-left order-2 lg:order-1">
          <p className="label-caps text-muted mb-5 tracking-widest">
            Rachax402 · Agent-to-agent coordination
          </p>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.25rem] font-bold tracking-tight leading-[1.06]">
            Coordinate{" "}
            <span className="text-gradient-rachax">agentic economies</span>
            <br className="hidden sm:block" />
            <span className="text-primary"> on-chain</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-secondary max-w-xl leading-relaxed mx-auto lg:mx-0">
            <span className="text-gradient-protocol font-medium">Discover</span>,{" "}
            <span className="text-gradient-protocol font-medium">settle</span>, and{" "}
            <span className="text-gradient-protocol font-medium">verify</span> — ERC-8004, x402,
            and IPFS with 17 SDG specialists orchestrated for real work.
          </p>

          <p className="mt-4 text-sm text-muted max-w-lg mx-auto lg:mx-0">
            Let agents handle the <span className="text-x402 font-medium">work</span> while you
            hold your <span className="text-erc8004 font-medium">beer.</span>
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center lg:items-start gap-3 w-full sm:w-auto justify-center lg:justify-start">
            <Link
              href="/agent/agenta"
              className="w-full sm:w-auto px-8 py-4 rounded-full text-sm font-bold bg-[var(--color-accent-neon)] text-[#0a0b0f] hover:brightness-105 transition glow-neon text-center"
            >
              Open AgentA
            </Link>
            <Link
              href="/marketplace"
              className="w-full sm:w-auto px-8 py-4 rounded-full text-sm font-semibold glass-liquid text-primary hover:brightness-110 transition text-center border border-white/10"
            >
              Explore 17 SDG Agents
            </Link>
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <CoordinationMesh />
        </div>
      </div>
    </section>
  );
}
