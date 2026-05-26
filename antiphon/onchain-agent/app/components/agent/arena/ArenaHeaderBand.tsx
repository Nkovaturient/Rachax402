import type { SDGAgent } from "@/lib/data/types";

export function ArenaHeaderBand({ agent }: { agent: SDGAgent }) {
  const meta = agent.unMeta;

  return (
    <div className="mb-6">
      <p className="label-caps text-[#64748b] mb-1">
        SDG {String(agent.number).padStart(2, "0")}
      </p>
      <h1 className="text-2xl sm:text-3xl font-bold text-[#f8fafc]">
        {meta?.officialTitle ?? agent.sdgTitle}
      </h1>
      <p className="text-[#94a3b8] mt-1">
        {agent.name} · {agent.role}
      </p>
      {meta && (
        <div className="flex flex-wrap gap-3 mt-4">
          <a
            href={meta.goalPageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#00d4aa] hover:underline border border-white/10 px-3 py-1.5 rounded-lg"
          >
            UN goal page
          </a>
          <a
            href={meta.progressReportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#8b5cf6] hover:underline border border-white/10 px-3 py-1.5 rounded-lg"
          >
            SDG Progress Report 2025
          </a>
        </div>
      )}
    </div>
  );
}
