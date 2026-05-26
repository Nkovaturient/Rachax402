import type { SDGAgent } from "@/lib/data/types";

export function ArenaToolsColumn({ agent }: { agent: SDGAgent }) {
  return (
    <aside className="lg:col-span-3 space-y-3">
      <p className="label-caps text-[#64748b]">Tools</p>
      {agent.tools.map((t) => (
        <div
          key={t.label}
          className="glass rounded-xl border border-white/[0.06] p-3"
        >
          <p className="text-sm font-medium text-[#e2e8f0]">{t.label}</p>
          <p className="text-xs text-[#94a3b8] mt-1">{t.description}</p>
          <p className="text-[10px] font-mono text-[#8b5cf6] mt-2">{t.capability}</p>
        </div>
      ))}
    </aside>
  );
}
