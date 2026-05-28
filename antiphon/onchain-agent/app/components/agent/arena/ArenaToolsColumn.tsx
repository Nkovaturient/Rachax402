import type { SDGAgent } from "@/lib/data/types";
import { GlassPanel } from "@/app/components/ui/GlassPanel";

export function ArenaToolsColumn({ agent }: { agent: SDGAgent }) {
  return (
    <aside className="lg:col-span-3 space-y-3">
      <p className="label-caps text-muted">Tools</p>
      {agent.tools.map((t) => (
        <GlassPanel key={t.label} variant="card" className="p-3">
          <p className="text-sm font-medium text-primary">{t.label}</p>
          <p className="text-xs text-secondary mt-1">{t.description}</p>
          <p className="text-[10px] font-mono text-erc8004 mt-2">{t.capability}</p>
        </GlassPanel>
      ))}
    </aside>
  );
}
