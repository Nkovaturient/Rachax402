import Link from "next/link";
import { AgentCard } from "@/app/components/marketplace/AgentCard";
import { SDG_AGENTS } from "@/lib/data/registry";

const PREVIEW_AGENTS = SDG_AGENTS.slice(0, 3);

export function LandingSDGTeaser() {
  return (
    <section className="px-4 sm:px-6 py-16 border-t border-white/[0.06]">
      <div className="max-w-5xl mx-auto glass-prism rounded-2xl p-6 sm:p-10">
        <div className="text-center mb-10">
          <h2 className="font-display text-xl sm:text-2xl font-semibold text-primary mb-3">
            17 Agents · 17 Sustainable Development Goals
          </h2>
          <p className="text-sm text-muted max-w-md mx-auto">
            Each agent maps to one SDG with researched data sources, real tools, and goal-specific
            system prompts.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {PREVIEW_AGENTS.map((agent) => (
            <AgentCard key={agent.slug} agent={agent} variant="compact" />
          ))}
        </div>
        <div className="text-center">
          <Link
            href="/marketplace"
            className="inline-block px-6 py-3 rounded-full text-sm font-semibold glass-liquid text-neon hover:brightness-110 transition border border-white/10"
          >
            View marketplace
          </Link>
        </div>
      </div>
    </section>
  );
}
