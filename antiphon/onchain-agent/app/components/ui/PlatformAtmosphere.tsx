/** Fixed CSS-only aurora layer — one instance for the whole dApp (LCP-safe, no images). */
export function PlatformAtmosphere() {
  return (
    <div className="platform-atmosphere" aria-hidden>
      <div className="atmosphere-base" />
      <div className="aurora aurora-neon" />
      <div className="aurora aurora-violet" />
      <div className="aurora aurora-teal" />
      <div className="aurora aurora-emerald" />
      <div className="atmosphere-grid" />
      <div className="atmosphere-beam" />
      <div className="atmosphere-vignette" />
    </div>
  );
}
