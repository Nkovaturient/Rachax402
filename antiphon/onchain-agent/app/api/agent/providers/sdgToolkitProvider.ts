import { tool } from "ai";
import { z } from "zod";
import { getSdgAgent } from "@/lib/data/registry";
import { boostQuery } from "@/lib/search/site-hints";
import { searchTavily } from "@/lib/search/tavily";
import { getPendingFile } from "../file-context";
import { errorResult, type SdgToolResult } from "@/lib/sdg/tool-errors";
import { TOOL_DESCRIPTIONS } from "@/lib/sdg/toolkit";
import { parseUploadedFile, SUPPORTED_LABEL } from "@/lib/sdg/file-parser";
import type { WebSearchPayload } from "@/lib/search/types";

const MAX_SEARCHES_PER_TURN = 2;

export function getSdgToolkitTools(options?: {
  agentSlug?: string;
  budget?: { count: number };
}) {
  const agent =
    options?.agentSlug && options.agentSlug !== "agenta"
      ? getSdgAgent(options.agentSlug)
      : undefined;
  const dataSources = agent?.dataSources ?? [];

  const tools: Record<string, unknown> = {};

  // ── lookup_official_indicator ──────────────────────────────────────────

  tools.lookup_official_indicator = tool({
    description: TOOL_DESCRIPTIONS.lookup_official_indicator,
    inputSchema: z.object({
      country_iso: z
        .string()
        .describe("2-letter ISO country code (e.g. KE, NG, IN)"),
      indicator_key: z
        .string()
        .describe("Short name of the indicator (e.g. poverty_headcount, primary_enrollment, co2_per_capita)"),
      year_range: z
        .string()
        .optional()
        .describe('Optional year range as "YYYY-YYYY" or single year "YYYY"'),
    }),
    execute: async ({ country_iso, indicator_key, year_range }): Promise<SdgToolResult> => {
      const yearHint = year_range ? ` ${year_range}` : "";
      const query = `${indicator_key.replace(/_/g, " ")} ${country_iso.toUpperCase()} statistics${yearHint}`;

      const boosted = boostQuery(query, dataSources);
      const result: WebSearchPayload = await searchTavily(boosted);

      if (!result.ok || result.results.length === 0) {
        return {
          ok: false,
          error_category: "not_found",
          error: `No indicator data found for ${indicator_key} in ${country_iso.toUpperCase()}. Try search_verified_evidence with a broader query.`,
        };
      }

      return {
        ok: true,
        data: {
          indicator_key,
          country_iso: country_iso.toUpperCase(),
          year_range: year_range ?? null,
          results: result.results,
        },
      };
    },
  });

  // ── search_verified_evidence ───────────────────────────────────────────

  tools.search_verified_evidence = tool({
    description: TOOL_DESCRIPTIONS.search_verified_evidence,
    inputSchema: z.object({
      query: z.string().describe("Search query for current data or reports"),
    }),
    execute: async ({ query }): Promise<SdgToolResult<WebSearchPayload>> => {
      const budget = options?.budget;
      if (budget) {
        budget.count += 1;
        if (budget.count > MAX_SEARCHES_PER_TURN) {
          return {
            ok: false,
            error_category: "rate_limit",
            error: "Search limit reached (2 per turn). Use existing results or ask user for CSV.",
          };
        }
      }

      const boosted = boostQuery(query, dataSources);
      const result: WebSearchPayload = await searchTavily(boosted);

      if (!result.ok) {
        return {
          ok: false,
          error_category: "system_error",
          error: result.error ?? "Search provider returned an error.",
        };
      }

      if (result.results.length === 0) {
        return {
          ok: false,
          error_category: "not_found",
          error: "No results found. Try different search terms or use lookup_official_indicator.",
        };
      }

      return { ok: true, data: result };
    },
  });

  // ── parse_uploaded_file ────────────────────────────────────────────────

  tools.parse_uploaded_file = tool({
    description: TOOL_DESCRIPTIONS.parse_uploaded_file,
    inputSchema: z.object({
      filename: z
        .string()
        .describe("Exact filename from the user's [File attached: \"...\"] message"),
    }),
    execute: async ({ filename }): Promise<SdgToolResult> => {
      const pending = getPendingFile();
      if (!pending) {
        return {
          ok: false,
          error_category: "not_found",
          error: `No file found. Ask the user to upload a file (${SUPPORTED_LABEL}).`,
        };
      }

      if (pending.filename !== filename) {
        return {
          ok: false,
          error_category: "validation",
          error: `File "${filename}" not found. The attached file is "${pending.filename}". Use the exact filename shown.`,
        };
      }

      if (pending.sizeBytes > 10 * 1024 * 1024) {
        return {
          ok: false,
          error_category: "validation",
          error: "File too large (max 10 MB). Ask user to trim or split the file.",
        };
      }

      return parseUploadedFile(pending);
    },
  });

  // ── compose_action_brief ───────────────────────────────────────────────

  tools.compose_action_brief = tool({
    description: TOOL_DESCRIPTIONS.compose_action_brief,
    inputSchema: z.object({
      findings: z
        .string()
        .describe("Bullet-point summary of key evidence from this session"),
      citations: z
        .string()
        .describe("List of source URLs referenced in findings"),
      limits: z
        .string()
        .describe("Acknowledged gaps in evidence or data quality"),
      actors: z
        .string()
        .describe("Recommended government, NGO, or community actors to act on findings"),
      verify: z
        .string()
        .describe("Checklist of steps to verify before acting on this brief"),
    }),
    execute: async (args): Promise<SdgToolResult> => {
      return {
        ok: true,
        data: {
          brief: {
            findings: args.findings,
            citations: args.citations,
            limits: args.limits,
            actors: args.actors,
            verify: args.verify,
          },
          handoff_note:
            "This brief was composed by the SDG agent from tool results. All claims should be verified by a human before action.",
        },
      };
    },
  });

  // ── escalate_for_human ─────────────────────────────────────────────────

  tools.escalate_for_human = tool({
    description: TOOL_DESCRIPTIONS.escalate_for_human,
    inputSchema: z.object({
      reason: z
        .enum(["weak_evidence", "permission_denied", "high_stakes", "user_requested"])
        .describe("Reason for escalation"),
      summary: z
        .string()
        .describe("What the agent attempted, what failed, and what the human should review"),
    }),
    execute: async ({ reason, summary }): Promise<SdgToolResult> => {
      return {
        ok: true,
        data: {
          escalated: true,
          reason,
          summary,
          handoff: `Session escalated for human review.\nReason: ${reason}\nSummary: ${summary}\n\nA human reviewer should examine the session log before any decisions are made.`,
        },
      };
    },
  });

  return tools;
}
