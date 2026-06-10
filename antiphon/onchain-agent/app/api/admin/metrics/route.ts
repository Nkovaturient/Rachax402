import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth/is-admin";
import { prisma } from "@/lib/prisma.client";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [turns, releases] = await Promise.all([
    prisma.agentTurnMetric.findMany({
      where: { createdAt: { gte: since } },
      select: {
        agentSlug: true,
        releaseId: true,
        durationMs: true,
        toolCallCount: true,
        toolErrorCount: true,
        errorCategories: true,
        x402Success: true,
        x402Usdc: true,
        citationCount: true,
        briefComplete: true,
        escalated: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.agentRelease.findMany({
      orderBy: [{ agentSlug: "asc" }, { version: "desc" }],
      select: { id: true, agentSlug: true, version: true, modelId: true, promptHash: true, isActive: true, createdAt: true },
    }),
  ]);

  // Per-slug aggregates
  const bySlug: Record<string, {
    runs: number;
    errorRate: number;
    p95DurationMs: number;
    x402SuccessRate: number | null;
    totalUsdc: number | null;
    briefCompleteRate: number | null;
    citationAvg: number | null;
    escalationRate: number | null;
  }> = {};

  const slugGroups: Record<string, typeof turns> = {};
  for (const t of turns) {
    (slugGroups[t.agentSlug] ??= []).push(t);
  }

  for (const [slug, rows] of Object.entries(slugGroups)) {
    const durations = rows.map((r) => r.durationMs).sort((a, b) => a - b);
    const p95 = durations[Math.floor(durations.length * 0.95)] ?? durations[durations.length - 1] ?? 0;
    const errorRate = rows.filter((r) => r.toolErrorCount > 0).length / rows.length;

    // AgentA: x402
    const x402Rows = rows.filter((r) => r.x402Success !== null);
    const x402SuccessRate = x402Rows.length
      ? x402Rows.filter((r) => r.x402Success).length / x402Rows.length
      : null;
    const totalUsdc = x402Rows.length
      ? x402Rows.reduce((s, r) => s + (r.x402Usdc ?? 0), 0)
      : null;

    // SDG
    const briefRows = rows.filter((r) => r.briefComplete !== null);
    const briefCompleteRate = briefRows.length
      ? briefRows.filter((r) => r.briefComplete).length / briefRows.length
      : null;
    const citRows = rows.filter((r) => r.citationCount !== null);
    const citationAvg = citRows.length
      ? citRows.reduce((s, r) => s + (r.citationCount ?? 0), 0) / citRows.length
      : null;
    const escalationRate = rows.filter((r) => r.escalated).length / rows.length;

    bySlug[slug] = { runs: rows.length, errorRate, p95DurationMs: p95, x402SuccessRate, totalUsdc, briefCompleteRate, citationAvg, escalationRate };
  }

  return NextResponse.json({ bySlug, releases, since: since.toISOString() });
}
