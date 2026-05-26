import { SdgIcon } from "@/app/components/SdgIcon";
import type { SDGAgent } from "@/lib/data/types";

export function ArenaCenterHero({ agent }: { agent: SDGAgent }) {
  const callouts = [
    ...agent.connectionBadges.slice(0, 2),
    ...agent.dataSources.slice(0, 2),
  ].slice(0, 4);

  return (
    <div className="flex flex-col items-center justify-center relative min-h-[280px]">
      <div
        className="absolute inset-0 rounded-2xl opacity-30 blur-3xl"
        style={{ backgroundColor: agent.accentColor }}
      />
      <div className="relative flex flex-col items-center gap-6 py-8 w-full">
        {callouts.map((label, i) => {
          const positions = [
            "left-0 top-8",
            "right-0 top-16",
            "left-4 bottom-24",
            "right-4 bottom-20",
          ];
          return (
            <span
              key={label}
              className={`absolute hidden sm:block text-[10px] font-mono text-[#64748b] border border-white/10 px-2 py-1 rounded-md bg-black/40 ${positions[i] ?? ""}`}
            >
              {label}
            </span>
          );
        })}
        <div
          className="w-32 h-16 border-2 rounded-lg opacity-80"
          style={{
            borderColor: agent.accentColor,
            transform: "rotateX(55deg) rotateZ(45deg)",
            boxShadow: `0 0 40px ${agent.accentColor}40`,
          }}
        />
        <div
          className="w-24 h-24 border-2 rounded-lg -mt-8 opacity-60"
          style={{
            borderColor: agent.accentColor,
            transform: "rotateX(55deg) rotateZ(45deg) translateZ(20px)",
          }}
        />
        <SdgIcon number={agent.number} accentColor={agent.accentColor} size={64} />
        <p className="text-center text-sm text-[#94a3b8] max-w-md px-4">
          {agent.description}
        </p>
      </div>
    </div>
  );
}
