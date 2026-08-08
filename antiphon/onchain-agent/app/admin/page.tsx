"use client";

import { useEffect, useState } from "react";
import { GlassPanel } from "@/app/components/ui/GlassPanel";

interface SlugStats {
  runs: number;
  errorRate: number;
  p95DurationMs: number;
  x402SuccessRate: number | null;
  totalUsdc: number | null;
  briefCompleteRate: number | null;
  citationAvg: number | null;
  escalationRate: number | null;
}

interface Release {
  id: string;
  agentSlug: string;
  version: number;
  modelId: string;
  promptHash: string;
  isActive: boolean;
  createdAt: string;
}

interface MetricsResponse {
  bySlug: Record<string, SlugStats>;
  releases: Release[];
  since: string;
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <GlassPanel variant="card" className="p-3 min-w-[120px] flex-1">
      <p className="text-[10px] text-muted uppercase tracking-wide">{label}</p>
      <p className="text-xl font-mono font-bold mt-1 text-primary">{value}</p>
    </GlassPanel>
  );
}

function pct(n: number | null) {
  if (n === null) return "—";
  return `${(n * 100).toFixed(0)}%`;
}
function ms(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}s` : `${n}ms`;
}

export default function AdminPage() {
  const [data, setData] = useState<MetricsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rolling, setRolling] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/metrics")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setError("Failed to load metrics"));
  }, []);

  async function rollback(agentSlug: string, version: number) {
    setRolling(`${agentSlug}@v${version}`);
    const res = await fetch("/api/admin/releases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentSlug, version }),
    });
    const json = await res.json();
    setRolling(null);
    if (json.ok) {
      setData((prev) =>
        prev
          ? {
              ...prev,
              releases: prev.releases.map((r) =>
                r.agentSlug === agentSlug
                  ? { ...r, isActive: r.version === version }
                  : r,
              ),
            }
          : prev,
      );
    }
  }

  if (error) return <p className="text-red-400 p-8">{error}</p>;
  if (!data) return <p className="text-muted p-8">Loading…</p>;

  const sentryUrl = process.env.NEXT_PUBLIC_SENTRY_ORG_URL ?? "https://sentry.io";

  const agentaStats = data.bySlug["agenta"];
  const sdgSlugs = Object.keys(data.bySlug).filter((s) => s !== "agenta").sort();

  const releasesBySlug: Record<string, Release[]> = {};
  for (const r of data.releases) {
    (releasesBySlug[r.agentSlug] ??= []).push(r);
  }

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-primary">Antiphon Ops</h1>
        <a
          href={sentryUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[#10b981] underline"
        >
          Sentry AI Agents →
        </a>
      </div>
      <p className="text-[11px] text-muted">Last 7 days · {new Date(data.since).toLocaleDateString()}</p>

      {/* AgentA */}
      <section>
        <h2 className="label-caps text-muted text-[10px] mb-3">AgentA (on-chain)</h2>
        {agentaStats ? (
          <div className="flex flex-wrap gap-2">
            <KpiCard label="Runs" value={String(agentaStats.runs)} />
            <KpiCard label="Tool Error Rate" value={pct(agentaStats.errorRate)} />
            <KpiCard label="p95 Duration" value={ms(agentaStats.p95DurationMs)} />
            <KpiCard label="x402 Success" value={pct(agentaStats.x402SuccessRate)} />
            <KpiCard label="Total USDC" value={agentaStats.totalUsdc !== null ? `$${agentaStats.totalUsdc.toFixed(4)}` : "—"} />
          </div>
        ) : (
          <p className="text-xs text-muted">No AgentA runs in window.</p>
        )}
      </section>

      {/* SDG overview */}
      <section>
        <h2 className="label-caps text-muted text-[10px] mb-3">SDG Agents</h2>
        {sdgSlugs.length === 0 ? (
          <p className="text-xs text-muted">No SDG runs in window.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono border-collapse">
              <thead>
                <tr className="text-muted text-[10px] uppercase">
                  <th className="text-left py-1 pr-4">Agent</th>
                  <th className="text-right py-1 pr-4">Runs</th>
                  <th className="text-right py-1 pr-4">Err%</th>
                  <th className="text-right py-1 pr-4">p95</th>
                  <th className="text-right py-1 pr-4">Brief%</th>
                  <th className="text-right py-1 pr-4">Citations avg</th>
                  <th className="text-right py-1">Escalated%</th>
                </tr>
              </thead>
              <tbody>
                {sdgSlugs.map((slug) => {
                  const s = data.bySlug[slug];
                  return (
                    <tr key={slug} className="border-t border-white/5">
                      <td className="py-1.5 pr-4 text-[#8b5cf6]">{slug}</td>
                      <td className="text-right py-1.5 pr-4 text-primary">{s.runs}</td>
                      <td className="text-right py-1.5 pr-4 text-primary">{pct(s.errorRate)}</td>
                      <td className="text-right py-1.5 pr-4 text-primary">{ms(s.p95DurationMs)}</td>
                      <td className="text-right py-1.5 pr-4 text-primary">{pct(s.briefCompleteRate)}</td>
                      <td className="text-right py-1.5 pr-4 text-primary">{s.citationAvg !== null ? s.citationAvg.toFixed(1) : "—"}</td>
                      <td className="text-right py-1.5 text-primary">{pct(s.escalationRate)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Release panel */}
      <section>
        <h2 className="label-caps text-muted text-[10px] mb-3">Releases & Rollback</h2>
        <div className="space-y-4">
          {Object.entries(releasesBySlug).map(([slug, rels]) => (
            <GlassPanel key={slug} variant="card" className="p-4">
              <p className="text-xs font-mono text-[#8b5cf6] mb-2">{slug}</p>
              <div className="space-y-1">
                {rels.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 text-[11px] font-mono">
                    <span className={r.isActive ? "text-[#10b981]" : "text-muted"}>
                      v{r.version} {r.isActive && "● active"}
                    </span>
                    <span className="text-muted">{r.modelId}</span>
                    <span className="text-muted/60">{r.promptHash}</span>
                    {!r.isActive && (
                      <button
                        type="button"
                        onClick={() => rollback(slug, r.version)}
                        disabled={rolling !== null}
                        className="ml-auto text-[10px] px-2 py-0.5 rounded border border-white/10 hover:border-white/30 transition disabled:opacity-40"
                      >
                        {rolling === `${slug}@v${r.version}` ? "…" : "Rollback"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </GlassPanel>
          ))}
        </div>
      </section>
    </main>
  );
}
