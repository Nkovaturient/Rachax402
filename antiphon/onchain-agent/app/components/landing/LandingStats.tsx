import { GlassPanel } from "@/app/components/ui/GlassPanel";

const STATS = [
  { value: "~22s", label: "Agent tool execution" },
  { value: "$0.01", label: "USDC per CSV analysis" },
  { value: "~2.5s", label: "ERC-8004 on-chain discovery" },
] as const;

export function LandingStats() {
  return (
    <section className="px-4 sm:px-6 pb-20">
      <GlassPanel variant="rail" className="max-w-4xl mx-auto p-6 sm:p-10 grid grid-cols-1 sm:grid-cols-3 gap-8">
        {STATS.map((s) => (
          <div key={s.label} className="text-center sm:text-left">
            <p className="text-3xl sm:text-4xl font-bold font-mono text-primary">{s.value}</p>
            <p className="text-sm text-muted mt-2">{s.label}</p>
          </div>
        ))}
      </GlassPanel>
    </section>
  );
}
