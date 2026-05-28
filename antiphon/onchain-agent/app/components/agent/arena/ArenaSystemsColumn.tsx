import type { SDGAgent } from "@/lib/data/types";
import { GlassPanel } from "@/app/components/ui/GlassPanel";

export function ArenaSystemsColumn({ agent }: { agent: SDGAgent }) {
  const meta = agent.unMeta;

  return (
    <aside className="lg:col-span-3 space-y-3" style={{ ["--agent-accent" as string]: agent.accentColor }}>
      <p className="label-caps text-muted">Systems</p>
      {meta && (
        <GlassPanel variant="card" accent={agent.accentColor} className="p-3 accent-border-l">
          <p className="text-[10px] text-muted uppercase">UN platform</p>
          <p className="text-sm text-primary mt-1">
            {meta.targetCount} targets · {meta.actionCount.toLocaleString()} actions
          </p>
        </GlassPanel>
      )}
      {agent.systems.map((m) => (
        <GlassPanel key={m.label} variant="card" accent={agent.accentColor} className="p-3 accent-border-l">
          <p className="text-[10px] text-muted uppercase">{m.label}</p>
          <p className="text-xl font-mono font-bold text-primary">
            {m.value}
            {m.unit && <span className="text-sm text-secondary ml-1">{m.unit}</span>}
          </p>
          {m.trend && <p className="text-[10px] text-muted mt-1">{m.trend}</p>}
        </GlassPanel>
      ))}
    </aside>
  );
}
