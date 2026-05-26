import { SiteHeader } from "@/app/components/SiteHeader";
import { AgentCard } from "@/app/components/marketplace/AgentCard";
import { SDG_AGENTS } from "@/lib/data/registry";

export default function MarketplacePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0a0b0f]">
      <SiteHeader />
      <main className="flex-grow px-4 sm:px-6 py-10 max-w-6xl mx-auto w-full">
        <p className="label-caps text-[#64748b] mb-2">Rachax402</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-[#f8fafc] tracking-tight mb-2">
          SDG Agent Marketplace
        </h1>
        <p className="text-sm text-[#94a3b8] max-w-2xl mb-10">
          17 persona agents aligned to the UN Sustainable Development Goals. Each uses
          ERC-8004, x402, Storacha, and live web research — one AgentKit stack.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SDG_AGENTS.map((agent) => (
            <AgentCard key={agent.slug} agent={agent} />
          ))}
        </div>
      </main>
    </div>
  );
}
