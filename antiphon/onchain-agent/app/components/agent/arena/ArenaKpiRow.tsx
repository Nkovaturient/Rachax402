import type { SDGAgent } from "@/lib/data/types";
import { GlassPanel } from "@/app/components/ui/GlassPanel";

function KpiCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: string;
}) {
  return (
    <GlassPanel variant="card" accent={accent} className="p-3 min-w-[120px] flex-1">
      <p className="text-[10px] text-muted uppercase tracking-wide">{label}</p>
      <p
        className="text-xl font-mono font-bold mt-1 text-primary"
        style={accent ? { color: accent } : undefined}
      >
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
    </GlassPanel>
  );
}

export function ArenaKpiRow({ agent }: { agent: SDGAgent }) {
  const meta = agent.unMeta;

  return (
    <div className="space-y-3 mb-6">
      {meta && (
        <div className="flex flex-wrap gap-2">
          <KpiCard label="Targets" value={meta.targetCount} accent={agent.accentColor} />
          <KpiCard label="Events" value={meta.eventCount} />
          <KpiCard label="Publications" value={meta.publicationCount} />
          <KpiCard label="Actions" value={meta.actionCount} />
        </div>
      )}
      <p className="label-caps text-muted text-[10px]">Agent focus metrics</p>
      <div className="flex flex-wrap gap-2">
        {agent.systems.slice(0, 3).map((m) => (
          <KpiCard
            key={m.label}
            label={m.label}
            value={`${m.value}${m.unit ? ` ${m.unit}` : ""}`}
            accent={agent.accentColor}
          />
        ))}
      </div>
    </div>
  );
}
