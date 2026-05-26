const FEATURES = [
  {
    title: "Discover",
    body: "ERC-8004 on-chain service registry — endpoints, prices, reputation in ~2.5s.",
    color: "text-[#8b5cf6]",
    href: "https://github.com/polus-dev/erc-8004",
  },
  {
    title: "Pay",
    body: "x402 micropayments via Permit2 on Base — gasless settlement for every task.",
    color: "text-[#10b981]",
    href: "https://github.com/coinbase/x402",
  },
  {
    title: "Verify",
    body: "Storacha IPFS storage and on-chain reputation proofs after each run.",
    color: "text-[#00d4aa]",
    href: "https://github.com/storacha/storacha",
  },
] as const;

export function LandingFeatures() {
  return (
    <section className="px-4 sm:px-6 py-20 border-t border-white/[0.06]">
      <h2 className="text-center text-2xl sm:text-4xl font-semibold text-[#e2e8f0] mb-4">
        Onchain economy
      </h2>
      <p className="mt-6 text-center text-md sm:text-xl text-[#94a3b8] max-w-2xl mx-auto leading-relaxed">
        Autonomous agents that{" "}
        <span className="text-[#c02595] font-medium">discover</span>,{" "}
        <span className="text-[#07f49e] font-medium">pay</span>, and{" "}
        <span className="text-[#80f0ff] font-medium">verify</span> — Onchain.
      </p>
      {/* <p className="text-center text-[#64748b] text-sm mb-12 max-w-lg mx-auto">
        Agent-to-agent coordination with payment-gated execution
      </p> */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {FEATURES.map((f) => (
          <a
            key={f.title}
            href={f.href}
            target="_blank"
            rel="noopener noreferrer"
            className="glass rounded-2xl border border-white/[0.06] p-6 hover:border-white/12 transition"
          >
            <h3 className={`text-lg font-bold mb-2 ${f.color}`}>{f.title}</h3>
            <p className="text-sm text-[#94a3b8] leading-relaxed">{f.body}</p>
          </a>
        ))}
      </div>
    </section>
  );
}
