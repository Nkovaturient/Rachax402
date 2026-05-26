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
      className="rounded-lg flex items-center justify-center font-mono font-bold text-white shrink-0"
      style={{
        width: size,
        height: size,
        backgroundColor: accentColor,
        fontSize: size * 0.35,
      }}
      aria-label={`SDG ${number}`}
    >
      {number}
    </div>
  );
}
