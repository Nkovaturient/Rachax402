import Link from "next/link";
import type { SDGAgent } from "@/lib/data/types";
import { SdgIcon } from "@/app/components/SdgIcon";

export function AgentCard({ agent }: { agent: SDGAgent }) {
  const id = String(agent.number).padStart(3, "0");

  return (
    <Link
      href={`/agent/${agent.slug}`}
      className="block glass rounded-xl border border-white/[0.08] hover:border-white/15 transition card-3d overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.06]">
        <span className="label-caps text-[#64748b]">Agent</span>
        <span className="font-mono text-xs text-[#94a3b8]">#{id}</span>
      </div>

      <div className="flex gap-3 p-4 border-b border-white/[0.06]">
        <SdgIcon number={agent.number} accentColor={agent.accentColor} />
        <div className="min-w-0">
          <p className="text-lg font-bold text-[#f8fafc] tracking-tight">{agent.name}</p>
          <p className="text-xs text-[#94a3b8]">{agent.role}</p>
          <p className="text-[10px] text-[#64748b] mt-1">{agent.sdgTitle}</p>
        </div>
      </div>

      <div className="px-4 py-3 border-b border-white/[0.06]">
        <p className="label-caps text-[#64748b] mb-2">Description</p>
        <p className="text-xs text-[#cbd5e1] leading-relaxed line-clamp-3">
          {agent.description}
        </p>
      </div>

      <div className="px-4 py-3">
        <p className="label-caps text-[#64748b] mb-2">Connections</p>
        <div className="flex flex-wrap gap-1.5">
          {agent.connectionBadges.map((b) => (
            <span
              key={b}
              className="text-[10px] px-2 py-0.5 rounded-full border border-white/10 text-[#94a3b8]"
            >
              {b}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
