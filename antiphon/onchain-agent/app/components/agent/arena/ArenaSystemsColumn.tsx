import type { SDGAgent } from "@/lib/data/types";

export function ArenaSystemsColumn({ agent }: { agent: SDGAgent }) {
  const meta = agent.unMeta;

  return (
    <aside className="lg:col-span-3 space-y-3">
      <p className="label-caps text-[#64748b]">Systems</p>
      {meta && (
        <>
          <div className="glass rounded-xl border border-white/[0.06] p-3">
            <p className="text-[10px] text-[#64748b] uppercase">UN platform</p>
            <p className="text-sm text-[#e2e8f0] mt-1">
              {meta.targetCount} targets · {meta.actionCount.toLocaleString()} actions
            </p>
          </div>
        </>
      )}
      {agent.systems.map((m) => (
        <div
          key={m.label}
          className="glass rounded-xl border border-white/[0.06] p-3"
        >
          <p className="text-[10px] text-[#64748b] uppercase">{m.label}</p>
          <p className="text-xl font-mono font-bold text-[#e2e8f0]">
            {m.value}
            {m.unit && (
              <span className="text-sm text-[#94a3b8] ml-1">{m.unit}</span>
            )}
          </p>
          {m.trend && (
            <p className="text-[10px] text-[#64748b] mt-1">{m.trend}</p>
          )}
        </div>
      ))}
    </aside>
  );
}
