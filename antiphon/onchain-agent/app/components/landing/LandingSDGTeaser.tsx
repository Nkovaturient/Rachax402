import Link from "next/link";

export function LandingSDGTeaser() {
  return (
    <section className="px-4 sm:px-6 py-16 text-center">
      <h2 className="text-xl sm:text-2xl font-semibold text-[#e2e8f0] mb-3">
        17 Agents · 17 Sustainable Development Goals
      </h2>
      <p className="text-sm text-[#64748b] max-w-md mx-auto mb-6">
        Each agent maps to one SDG with researched data sources, real tools, and
        goal-specific system prompts.
      </p>
      <Link
        href="/marketplace"
        className="inline-block px-6 py-3 rounded-full text-sm font-semibold border border-[#dfff00]/40 text-[#dfff00] hover:bg-[#dfff00]/10 transition"
      >
        View marketplace
      </Link>
    </section>
  );
}
