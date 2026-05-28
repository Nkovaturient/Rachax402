export function SdgIcon({
  number,
  accentColor,
  size = 48,
}: {
  number: number;
  accentColor: string;
  size?: number;
}) {
  return (
    <div
      className="relative rounded-2xl flex items-center justify-center font-mono font-bold text-white shrink-0 glass-light"
      style={{
        width: size,
        height: size,
        ["--agent-accent" as string]: accentColor,
        background: `linear-gradient(145deg, color-mix(in srgb, ${accentColor} 88%, white) 0%, ${accentColor} 100%)`,
        boxShadow: `0 0 20px -4px color-mix(in srgb, ${accentColor} 50%, transparent), inset 0 1px 0 rgba(255,255,255,0.25)`,
      }}
      aria-label={`SDG ${number}`}
    >
      <span style={{ fontSize: size * 0.35 }}>{number}</span>
    </div>
  );
}
