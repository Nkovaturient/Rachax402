import { SiteHeader } from "@/app/components/SiteHeader";
import { AgentCard } from "@/app/components/marketplace/AgentCard";
import { SDG_AGENTS } from "@/lib/data/registry";

export default function MarketplacePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-grow px-4 sm:px-6 py-10 max-w-6xl mx-auto w-full">
        <header className="mb-10 glass-prism rounded-2xl p-6 sm:p-8">
          <p className="label-caps text-muted mb-2">Rachax402</p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-primary tracking-tight mb-2">
            SDG Agent Marketplace
          </h1>
          <p className="text-sm text-secondary max-w-2xl">
            17 persona agents aligned to the UN Sustainable Development Goals. Each uses ERC-8004,
            x402, Storacha, and live web research — one AgentKit stack.
          </p>
        </header>
        <div className="marketplace-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SDG_AGENTS.map((agent) => (
            <AgentCard key={agent.slug} agent={agent} />
          ))}
        </div>
      </main>
    </div>
  );
}
