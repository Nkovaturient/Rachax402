import { tool } from "ai";
import { z } from "zod";
import { getSdgAgent } from "@/lib/data/registry";
import { boostQuery } from "@/lib/search/site-hints";
import { searchTavily } from "@/lib/search/tavily";
import { getPendingFile } from "../file-context";
import { errorResult, type SdgToolResult } from "@/lib/sdg/tool-errors";
import { DEVCOMPASS_DESCRIPTIONS } from "@/lib/sdg/toolkit";
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
    description: DEVCOMPASS_DESCRIPTIONS.lookup_official_indicator,
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
    description: DEVCOMPASS_DESCRIPTIONS.search_verified_evidence,
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

  // ── analyze_user_dataset ───────────────────────────────────────────────

  tools.analyze_user_dataset = tool({
    description: DEVCOMPASS_DESCRIPTIONS.analyze_user_dataset,
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
          error: "No file found. Ask the user to upload a CSV.",
        };
      }

      if (pending.filename !== filename) {
        return {
          ok: false,
          error_category: "validation",
          error: `File "${filename}" not found. The attached file is "${pending.filename}". Use the exact filename shown.`,
        };
      }

      if (!pending.mimeType.includes("csv") && !filename.endsWith(".csv")) {
        return {
          ok: false,
          error_category: "validation",
          error: "File is not a CSV. Only CSV files can be analysed with this tool.",
        };
      }

      if (pending.sizeBytes > 10 * 1024 * 1024) {
        return {
          ok: false,
          error_category: "validation",
          error: "File too large (max 10 MB). Ask user to trim columns or rows.",
        };
      }

      try {
        const csvText = Buffer.from(pending.base64, "base64").toString("utf-8");
        const lines = csvText.trim().split("\n");
        if (lines.length < 2) {
          return {
            ok: false,
            error_category: "validation",
            error: "CSV appears empty or has only a header. Check the file.",
          };
        }

        const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
        const rows = lines.slice(1).map((line) => {
          const cells: string[] = [];
          let inQuotes = false;
          let cell = "";
          for (const ch of line) {
            if (ch === '"') { inQuotes = !inQuotes; continue; }
            if (ch === "," && !inQuotes) { cells.push(cell.trim()); cell = ""; continue; }
            cell += ch;
          }
          cells.push(cell.trim());
          return cells;
        });

        const columnStats = headers.map((col, i) => {
          const values = rows.map((r) => r[i] ?? "").filter((v) => v !== "");
          const numericValues = values
            .map((v) => parseFloat(v))
            .filter((n) => !isNaN(n));
          const nullCount = rows.length - values.length;

          let stats: Record<string, unknown> = {
            column: col,
            total_rows: rows.length,
            non_null: values.length,
            null_count: nullCount,
            null_pct: rows.length > 0 ? ((nullCount / rows.length) * 100).toFixed(1) + "%" : "0%",
          };

          if (numericValues.length > 0) {
            const sorted = [...numericValues].sort((a, b) => a - b);
            stats = {
              ...stats,
              type: "numeric",
              min: sorted[0],
              max: sorted[sorted.length - 1],
              mean: (numericValues.reduce((a, b) => a + b, 0) / numericValues.length).toFixed(2),
              median: sorted[Math.floor(sorted.length / 2)],
            };
          } else {
            stats = {
              ...stats,
              type: "text",
              unique_values: new Set(values).size,
              sample_values: [...new Set(values)].slice(0, 5),
            };
          }

          return stats;
        });

        return {
          ok: true,
          data: {
            filename,
            total_rows: rows.length,
            total_columns: headers.length,
            columns: columnStats,
          },
        };
      } catch (err) {
        return {
          ok: false,
          error_category: "system_error",
          error: "Failed to parse CSV. Check file encoding (UTF-8 expected).",
        };
      }
    },
  });

  // ── compose_action_brief ───────────────────────────────────────────────

  tools.compose_action_brief = tool({
    description: DEVCOMPASS_DESCRIPTIONS.compose_action_brief,
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
    description: DEVCOMPASS_DESCRIPTIONS.escalate_for_human,
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
