import { GlassPanel } from "@/app/components/ui/GlassPanel";

const FEATURES = [
  {
    title: "Discover",
    body: "ERC-8004 on-chain service registry — endpoints, prices, reputation in ~2.5s.",
    color: "text-erc8004",
    href: "https://github.com/polus-dev/erc-8004",
  },
  {
    title: "Pay",
    body: "x402 micropayments via Permit2 on Base — gasless settlement for every task.",
    color: "text-x402",
    href: "https://github.com/coinbase/x402",
  },
  {
    title: "Verify",
    body: "Storacha IPFS storage and on-chain reputation proofs after each run.",
    color: "text-storacha",
    href: "https://github.com/storacha/storacha",
  },
] as const;

export function LandingFeatures() {
  return (
    <section className="px-4 sm:px-6 py-20 border-t border-white/[0.06]">
      <h2 className="font-display text-center text-2xl sm:text-4xl font-semibold text-primary mb-4">
        Onchain economy
      </h2>
      <p className="mt-6 text-center text-md sm:text-xl text-secondary max-w-2xl mx-auto leading-relaxed">
        Autonomous agents that{" "}
        <span className="text-[#c02595] font-medium">discover</span>,{" "}
        <span className="text-x402 font-medium">pay</span>, and{" "}
        <span className="text-[#80f0ff] font-medium">verify</span> — on-chain.
      </p>
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        {FEATURES.map((f) => (
          <a
            key={f.title}
            href={f.href}
            target="_blank"
            rel="noopener noreferrer"
            className="block transition hover:brightness-110"
          >
            <GlassPanel variant="liquid" className="p-6 h-full hover:border-white/15">
              <h3 className={`font-display text-lg font-bold mb-2 ${f.color}`}>{f.title}</h3>
              <p className="text-sm text-secondary leading-relaxed">{f.body}</p>
            </GlassPanel>
          </a>
        ))}
      </div>
    </section>
  );
}
