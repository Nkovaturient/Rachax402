const NODES = [
  { cx: 200, cy: 52, fill: "rgba(223,255,0,0.95)", label: "discover" },
  { cx: 348, cy: 200, fill: "rgba(16,185,129,0.95)", label: "pay" },
  { cx: 200, cy: 348, fill: "rgba(0,212,170,0.95)", label: "verify" },
  { cx: 52, cy: 200, fill: "rgba(139,92,246,0.95)", label: "store" },
] as const;

export function CoordinationMesh() {
  return (
    <div
      className="relative hidden lg:flex items-center justify-center min-h-[360px] w-full"
      aria-hidden
    >
      <div className="absolute inset-0 rounded-3xl glass-prism opacity-40" />
      <svg viewBox="0 0 400 400" className="relative w-full max-w-md h-auto" fill="none">
        <defs>
          <radialGradient id="hubGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(223,255,0,0.25)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <circle cx="200" cy="200" r="150" fill="url(#hubGlow)" />
        <circle cx="200" cy="200" r="145" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        <circle
          cx="200"
          cy="200"
          r="118"
          stroke="rgba(223,255,0,0.2)"
          strokeWidth="1"
          strokeDasharray="3 10"
          className="mesh-orbit"
          style={{ transformOrigin: "200px 200px" }}
        />
        <circle
          cx="200"
          cy="200"
          r="82"
          stroke="rgba(139,92,246,0.15)"
          strokeWidth="1"
          strokeDasharray="2 8"
          className="mesh-orbit-reverse"
          style={{ transformOrigin: "200px 200px" }}
        />

        {NODES.map((n) => (
          <line
            key={n.label}
            x1="200"
            y1="200"
            x2={n.cx}
            y2={n.cy}
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="1"
          />
        ))}
        {NODES.map((n, i) => (
          <line
            key={`pulse-${n.label}`}
            x1="200"
            y1="200"
            x2={n.cx}
            y2={n.cy}
            stroke={n.fill}
            strokeWidth="1.5"
            strokeOpacity="0.5"
            className="mesh-flow"
            style={{ animationDelay: `${i * 0.4}s` }}
          />
        ))}

        {NODES.map((n) => (
          <g key={n.label} filter="url(#nodeGlow)">
            <circle cx={n.cx} cy={n.cy} r="10" fill={n.fill} className="mesh-pulse" />
          </g>
        ))}

        <circle
          cx="200"
          cy="200"
          r="32"
          fill="rgba(8,10,20,0.9)"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="1"
        />
        <text
          x="200"
          y="198"
          textAnchor="middle"
          fill="#dfff00"
          fontSize="10"
          fontFamily="var(--font-mono)"
          fontWeight="600"
        >
          A2A
        </text>
        <text x="200" y="212" textAnchor="middle" fill="rgba(148,163,184,0.9)" fontSize="7" fontFamily="var(--font-mono)">
          HUB
        </text>
      </svg>
    </div>
  );
}
