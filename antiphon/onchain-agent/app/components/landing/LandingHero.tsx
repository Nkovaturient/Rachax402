import Link from "next/link";

export function LandingHero() {
  return (
    <section className="relative min-h-[85vh] flex flex-col items-center justify-center px-4 sm:px-6 pt-24 pb-16 text-center">
      <p className="label-caps text-[#64748b] mb-4 tracking-widest">
        Agents x DeFi
      </p>
      <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight leading-[1.05] max-w-4xl">
        Fueling
        <span className="text-[#f8fafc]"> Open-ended </span>
        <span className="text-[#dfff00]">Agentic</span>
        <span className="text-gradient-rachax"> Economies</span>
      </h1>
      <p className="mt-6 text-lg sm:text-xl text-[#94a3b8] max-w-2xl leading-relaxed">
        Let the agents handle the <span className="text-[#07f49e] font-medium">work; </span>{" "} while you hold your
        {/* <span className="text-[#c02595] font-medium">discover</span>,{" "}
        <span className="text-[#07f49e] font-medium">pay</span>, and{" "} */}
        <span className="text-[#80f0ff] font-medium"> beer.</span>
      </p>
      {/* <p className="mt-3 text-sm text-[#64748b] max-w-xl">
        ERC-8004 discovery · x402 payments · Storacha evidence · 17 SDG-specialist agents
      </p> */}
      <div className="mt-10 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
        <Link
          href="/agent/agenta"
          className="w-full sm:w-auto px-8 py-4 rounded-full text-sm font-bold bg-[#dfff00] text-[#0a0b0f] hover:opacity-90 transition shadow-[0_0_48px_-8px_rgba(223,255,0,0.45)]"
        >
          Open AgentA
        </Link>
        <Link
          href="/marketplace"
          className="w-full sm:w-auto px-8 py-4 rounded-full text-sm font-semibold border border-white/20 text-[#e2e8f0] hover:bg-white/5 transition"
        >
          Explore 17 SDG Agents
        </Link>
      </div>
    </section>
  );
}
