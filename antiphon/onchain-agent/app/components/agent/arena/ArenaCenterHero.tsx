import { SdgIcon } from "@/app/components/SdgIcon";
import type { SDGAgent } from "@/lib/data/types";

export function ArenaCenterHero({ agent }: { agent: SDGAgent }) {
  const callouts = [
    ...agent.connectionBadges.slice(0, 2),
    ...agent.dataSources.slice(0, 2),
  ].slice(0, 4);

  const positions = ["left-0 top-8", "right-0 top-16", "left-4 bottom-24", "right-4 bottom-20"];

  return (
    <div
      className="flex flex-col items-center justify-center relative min-h-[280px]"
      style={{ ["--agent-accent" as string]: agent.accentColor }}
    >
      <div
        className="absolute inset-0 rounded-2xl opacity-25 blur-3xl"
        style={{ backgroundColor: agent.accentColor }}
      />
      <div className="relative flex flex-col items-center gap-6 py-8 w-full">
        <svg
          viewBox="0 0 200 200"
          className="absolute w-48 h-48 opacity-40 mesh-orbit"
          aria-hidden
          style={{ transformOrigin: "center" }}
        >
          <circle
            cx="100"
            cy="100"
            r="88"
            fill="none"
            stroke={agent.accentColor}
            strokeWidth="1"
            strokeOpacity="0.35"
            strokeDasharray="6 10"
          />
          <circle
            cx="100"
            cy="100"
            r="58"
            fill="none"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="1"
          />
        </svg>

        {callouts.map((label, i) => (
          <span
            key={label}
            className={`absolute hidden sm:block text-[10px] font-mono text-muted glass-light px-2 py-1 rounded-md ${positions[i] ?? ""}`}
          >
            {label}
          </span>
        ))}

        <div className="glass-prism rounded-2xl p-6 accent-rim flex flex-col items-center gap-4">
          <SdgIcon number={agent.number} accentColor={agent.accentColor} size={64} />
          <p className="text-center text-sm text-secondary max-w-md px-2">{agent.description}</p>
        </div>
      </div>
    </div>
  );
}
