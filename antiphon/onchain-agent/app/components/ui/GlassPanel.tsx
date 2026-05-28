import type { CSSProperties, ReactNode } from "react";

const VARIANT_CLASS = {
  card: "glass-card rounded-xl",
  rail: "glass-rail rounded-2xl",
  liquid: "glass-liquid rounded-2xl",
  prism: "glass-prism rounded-2xl",
} as const;

type Variant = keyof typeof VARIANT_CLASS;

export function GlassPanel({
  children,
  className = "",
  variant = "card",
  accent,
  style,
}: {
  children: ReactNode;
  className?: string;
  variant?: Variant;
  accent?: string;
  style?: CSSProperties;
}) {
  const accentStyle = accent
    ? ({ ["--agent-accent" as string]: accent } as CSSProperties)
    : undefined;

  return (
    <div
      className={`${VARIANT_CLASS[variant]} ${className}`}
      style={{ ...accentStyle, ...style }}
    >
      {children}
    </div>
  );
}
