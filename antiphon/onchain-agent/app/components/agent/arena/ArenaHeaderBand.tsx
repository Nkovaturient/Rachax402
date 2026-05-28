import type { SDGAgent } from "@/lib/data/types";

export function ArenaHeaderBand({ agent }: { agent: SDGAgent }) {
  const meta = agent.unMeta;

  return (
    <div className="mb-6">
      <p className="label-caps text-muted mb-1">SDG {String(agent.number).padStart(2, "0")}</p>
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-primary">
        {meta?.officialTitle ?? agent.sdgTitle}
      </h1>
      <p className="text-secondary mt-1">
        {agent.name} · {agent.role}
      </p>
      {meta && (
        <div className="flex flex-wrap gap-3 mt-4">
          <a
            href={meta.goalPageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-storacha hover:underline glass-light px-3 py-1.5 rounded-lg"
          >
            UN goal page
          </a>
          <a
            href={meta.progressReportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-erc8004 hover:underline glass-light px-3 py-1.5 rounded-lg"
          >
            SDG Progress Report 2025
          </a>
        </div>
      )}
    </div>
  );
}
