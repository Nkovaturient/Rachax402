import Link from "next/link";
import type { SDGAgent } from "@/lib/data/types";
import { SdgIcon } from "@/app/components/SdgIcon";

export function AgentCard({
  agent,
  variant = "default",
}: {
  agent: SDGAgent;
  variant?: "default" | "compact";
}) {
  const id = String(agent.number).padStart(3, "0");
  const isCompact = variant === "compact";

  return (
    <Link
      href={`/agent/${agent.slug}`}
      className={`group block rounded-2xl overflow-hidden accent-rim accent-rim-hover agent-card-hover glass-prism ${
        isCompact ? "h-full" : ""
      }`}
      style={{ ["--agent-accent" as string]: agent.accentColor }}
    >
      <div className="accent-wash-top h-1.5" style={{ ["--agent-accent" as string]: agent.accentColor }} />

      <div className={isCompact ? "p-4" : "p-0"}>
        {!isCompact && (
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.06]">
            <span className="label-caps text-muted">Agent</span>
            <span className="font-mono text-xs text-secondary">#{id}</span>
          </div>
        )}

        <div className={`flex gap-3 ${isCompact ? "" : "p-4 border-b border-white/[0.06]"}`}>
          <SdgIcon number={agent.number} accentColor={agent.accentColor} size={isCompact ? 40 : 48} />
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg font-bold text-primary tracking-tight">{agent.name}</p>
            <p className="text-xs text-secondary">{agent.role}</p>
            {!isCompact && (
              <p className="text-[10px] text-muted mt-1 line-clamp-1">{agent.sdgTitle}</p>
            )}
          </div>
        </div>

        <div className={isCompact ? "px-0 pt-2" : "px-4 py-3"}>
          <p
            className={`text-secondary leading-relaxed ${
              isCompact ? "text-xs line-clamp-2" : "text-xs line-clamp-3"
            }`}
          >
            {agent.description}
          </p>
        </div>

        {!isCompact && (
          <div className="px-4 pb-4 flex flex-wrap gap-1.5">
            {agent.connectionBadges.map((b) => (
              <span
                key={b}
                className="text-[10px] px-2 py-0.5 rounded-full glass-light text-secondary"
              >
                {b}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
