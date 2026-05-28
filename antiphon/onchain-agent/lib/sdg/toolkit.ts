import type { ErrorCategory } from "./tool-errors";

// ── Tool display metadata ──────────────────────────────────────────────────

export const SDG_TOOL_META = {
  lookup_official_indicator: {
    label: "Lookup Indicator",
    description:
      "Query structured statistics from catalog sources (v1: curated web lookup with site hints, not live API). Returns indicator values with source URLs.",
    capability: "lookup",
  },
  search_verified_evidence: {
    label: "Search Evidence",
    description:
      "Search the web for current statistics and reports from verified sources. Max 2 calls per turn. Returns title, snippet, and URL for each result.",
    capability: "search",
  },
  analyze_user_dataset: {
    label: "Analyze Dataset",
    description:
      "Parse and summarize a user-uploaded CSV file server-side. Returns column stats, row count, null percentages, and simple aggregates. No IPFS or blockchain storage.",
    capability: "csv",
  },
  compose_action_brief: {
    label: "Compose Brief",
    description:
      "Draft a structured action brief with required sections: Findings, Citations, Limits, Actors, Verify checklist. Model fills content from prior tool results.",
    capability: "brief",
  },
  escalate_for_human: {
    label: "Escalate",
    description:
      "Flag this session for human review when evidence is weak, permissions are denied, or stakes are high. Returns a handoff summary for the human reviewer.",
    capability: "escalate",
  },
} as const;

export type SdgToolId = keyof typeof SDG_TOOL_META;

// ── DEVCOMPASS tool descriptions (machine-readable, used in tool schemas) ──

export const DEVCOMPASS_DESCRIPTIONS: Record<SdgToolId, string> = {
  lookup_official_indicator: `Look up structured statistics from official catalog sources.

Purpose: Retrieve indicator values for a specific country and metric. Use this when the user asks for a known indicator (poverty rate, school enrollment, CO2 emissions) for a specific country or region.

When NOT to use: When the user asks an open-ended question needing current news or multiple perspectives — use search_verified_evidence instead.

Input fields:
- country_iso (required): 2-letter ISO country code (e.g. "KE", "NG", "IN")
- indicator_key (required): short name of the indicator (e.g. "poverty_headcount", "primary_enrollment", "co2_per_capita")
- year_range (optional): "YYYY-YYYY" or single year "YYYY"

Failure mapping:
- not_found → indicator or country not in catalog; suggest search_verified_evidence
- permission → catalog access denied; escalate_for_human
- validation → malformed country_iso or indicator_key; correct and retry once
- timeout → catalog timeout; retry once, then fall back to search_verified_evidence
- rate_limit → rate limited; wait and retry once
- system_error → catalog internal error; do not retry, use search_verified_evidence`,

  search_verified_evidence: `Search the web for current statistics and reports from verified sources.

Purpose: Find up-to-date evidence, reports, and data for open-ended questions. Use Tavily search with source-site hints from the agent's configured data sources.

When NOT to use: When the user asks for a specific indicator value from a known catalog — use lookup_official_indicator first, then search_verified_evidence to fill gaps.

Input fields:
- query (required): search query string, preferably with year and location context

Failure mapping:
- not_found → no results for query; suggest different terms or lookup_official_indicator
- permission → search provider access denied; escalate_for_human
- validation → empty or too-short query; reformulate
- timeout → search timeout; retry once with narrower query
- rate_limit → max 2 searches per turn reached; use existing results or ask user for CSV
- system_error → search provider error; do not retry, ask user for CSV upload`,

  analyze_user_dataset: `Parse and summarize a user-uploaded CSV file server-side.

Purpose: Extract column statistics, row counts, null percentages, and simple aggregates from a CSV file the user has attached. No IPFS or blockchain storage — local server-side processing only.

When NOT to use: When no file is attached — ask the user to upload a CSV first.

Input fields:
- filename (required): the exact filename shown in the user's [File attached: "..."] message

Failure mapping:
- not_found → file not found server-side; ask user to re-upload
- permission → cannot read file; escalate_for_human
- validation → file is not valid CSV or is empty; tell user the format issue
- timeout → file too large; ask user to trim columns or rows
- rate_limit → N/A for this tool
- system_error → parsing crashed; ask user to check file encoding`,

  compose_action_brief: `Draft a structured action brief for human decision-makers.

Purpose: Synthesize findings from prior tool calls into a structured brief with mandatory sections. The model fills content from lookup/search/analyze results.

When NOT to use: When no tools have been called yet — gather evidence first via lookup_official_indicator, search_verified_evidence, or analyze_user_dataset.

Input fields:
- findings (required): bullet-point summary of key evidence from this session
- citations (required): list of source URLs referenced in findings
- limits (required): acknowledged gaps in evidence or data quality
- actors (required): recommended government/NGO/community actors to act on findings
- verify (required): checklist of steps to verify before acting

Failure mapping:
- validation → required fields missing; re-compose with all fields
- All other categories: N/A — this is a model-structured output, not an external call`,

  escalate_for_human: `Flag this session for human review.

Purpose: Escalate when evidence is too weak to support findings, a tool returns permission errors, or the user's question involves high-stakes decisions requiring human judgment.

When NOT to use: When tools return valid data and the brief can be confidently composed — use compose_action_brief instead.

Input fields:
- reason (required): "weak_evidence" | "permission_denied" | "high_stakes" | "user_requested"
- summary (required): what the agent attempted, what failed, what a human should review

Failure mapping: N/A — this tool always succeeds and returns a handoff summary.`,
};

// ── Error category to agent behavior mapping ──────────────────────────────

export const ERROR_BEHAVIOR: Record<ErrorCategory, string> = {
  not_found: "Refine query or try a different source. Do not invent data.",
  permission: "Do not retry. Note the gap and offer escalate_for_human.",
  validation: "Correct input fields and retry once.",
  timeout: "Retry once with narrower scope, then move to next step.",
  rate_limit: "Wait briefly and retry once, or use alternative source.",
  system_error: "Do not retry. Note the failure and move to next workflow step.",
};
