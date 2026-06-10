import { prisma } from "@/lib/prisma.client";
import { isSdgSlug } from "@/lib/data/registry";

const SDG_BRIEF_SECTIONS = ["Findings", "Citations", "Limits", "Actors", "Verify"];
const URL_RE = /https?:\/\/[^\s)>"]+/g;
const KEY_RE = /\b(sk-[a-zA-Z0-9]{20,}|[0-9a-f]{64})\b/;

interface CollectedToolResult {
  toolName: string;
  result: unknown;
}

export interface DomainMetricsInput {
  conversationId: string;
  agentSlug: string;
  releaseId: string;
  durationMs: number;
  toolResults: CollectedToolResult[];
  assistantText: string;
}

function countToolErrors(results: CollectedToolResult[]): {
  count: number;
  categories: Record<string, number>;
} {
  let count = 0;
  const categories: Record<string, number> = {};
  for (const { result } of results) {
    const r = result as Record<string, unknown> | null;
    if (r && typeof r === "object" && r.ok === false) {
      count++;
      const cat = typeof r.error_category === "string" ? r.error_category : "unknown";
      categories[cat] = (categories[cat] ?? 0) + 1;
    }
  }
  return { count, categories };
}

function scoreX402(results: CollectedToolResult[]): { success: boolean | null; usdc: number | null } {
  const x402Tools = ["paidStoreFile", "paidRetrieveFile", "X402ActionProvider_retry_http_request_with_x402"];
  const relevant = results.filter((r) => x402Tools.includes(r.toolName));
  if (relevant.length === 0) return { success: null, usdc: null };

  const anySuccess = relevant.some((r) => {
    const result = r.result as Record<string, unknown> | null;
    return result && typeof result === "object" && result.ok !== false;
  });

  // Extract USDC amounts from result text — best-effort parse
  let usdc = 0;
  for (const { result } of relevant) {
    const text = typeof result === "string" ? result : JSON.stringify(result ?? "");
    const match = text.match(/(\d+(?:\.\d+)?)\s*USDC/i);
    if (match) usdc += parseFloat(match[1]);
  }

  return { success: anySuccess, usdc: usdc > 0 ? usdc : null };
}

function scoreSdgBrief(assistantText: string, results: CollectedToolResult[]): {
  briefComplete: boolean | null;
  citationCount: number | null;
  escalated: boolean;
} {
  const hasEscalation = results.some((r) => r.toolName === "escalate_for_human");

  // Only score brief if compose_action_brief was called
  const hasBrief = results.some((r) => r.toolName === "compose_action_brief");
  if (!hasBrief) {
    return { briefComplete: null, citationCount: null, escalated: hasEscalation };
  }

  // Check all 5 mandatory sections
  const briefComplete = SDG_BRIEF_SECTIONS.every((s) =>
    assistantText.toLowerCase().includes(s.toLowerCase()),
  );

  // Count unique source URLs from tool results that appear in assistant output
  const toolUrls = new Set<string>();
  for (const { result } of results) {
    const text = typeof result === "string" ? result : JSON.stringify(result ?? "");
    for (const url of text.matchAll(URL_RE)) toolUrls.add(url[0]);
  }
  let citationCount = 0;
  for (const url of toolUrls) {
    if (assistantText.includes(url)) citationCount++;
  }

  return { briefComplete, citationCount, escalated: hasEscalation };
}

export async function persistTurnMetric(input: DomainMetricsInput): Promise<void> {
  const { conversationId, agentSlug, releaseId, durationMs, toolResults, assistantText } = input;

  // Suppress if private key leaked — log for ops, do not silence the rest of the pipeline
  if (KEY_RE.test(assistantText)) {
    console.error("[domain-metrics] ALERT: potential key in assistant output", { agentSlug, conversationId });
  }

  const toolCallCount = toolResults.length;
  const { count: toolErrorCount, categories: errorCategories } = countToolErrors(toolResults);

  let x402Success: boolean | null = null;
  let x402Usdc: number | null = null;
  let citationCount: number | null = null;
  let briefComplete: boolean | null = null;
  let escalated = false;

  if (isSdgSlug(agentSlug)) {
    const sdg = scoreSdgBrief(assistantText, toolResults);
    citationCount = sdg.citationCount;
    briefComplete = sdg.briefComplete;
    escalated = sdg.escalated;
  } else {
    const x402 = scoreX402(toolResults);
    x402Success = x402.success;
    x402Usdc = x402.usdc;
  }

  await prisma.agentTurnMetric.create({
    data: {
      conversationId,
      agentSlug,
      releaseId,
      durationMs,
      toolCallCount,
      toolErrorCount,
      errorCategories: Object.keys(errorCategories).length > 0 ? errorCategories : undefined,
      x402Success,
      x402Usdc,
      citationCount,
      briefComplete,
      escalated,
    },
  });
}
