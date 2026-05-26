import { tool } from "ai";
import { z } from "zod";
import { getSdgAgent } from "@/lib/data/registry";
import { boostQuery } from "@/lib/search/site-hints";
import { searchTavily } from "@/lib/search/tavily";
import type { WebSearchPayload } from "@/lib/search/types";

const MAX_SEARCHES_PER_TURN = 2;

export type SearchBudget = { count: number };

export function getWebSearchTool(options?: {
  agentSlug?: string;
  budget?: SearchBudget;
}) {
  const dataSources =
    options?.agentSlug && options.agentSlug !== "agenta"
      ? (getSdgAgent(options.agentSlug)?.dataSources ?? [])
      : [];

  return {
    web_search: tool({
      description:
        "Search the web for current statistics and reports. Returns structured results with title, snippet, and url. Max 2 calls per user message. If ok is false, tell the user live search failed.",
      inputSchema: z.object({
        query: z.string().describe("Search query for current data or reports"),
      }),
      execute: async ({ query }): Promise<WebSearchPayload> => {
        const budget = options?.budget;
        if (budget) {
          budget.count += 1;
          if (budget.count > MAX_SEARCHES_PER_TURN) {
            return {
              query,
              ok: false,
              results: [],
              error:
                "Search limit reached (2 per turn). Use arena dataSources or ask for CSV.",
            };
          }
        }

        const boosted = dataSources.length > 0 ? boostQuery(query, dataSources) : query;
        return searchTavily(boosted);
      },
    }),
  };
}
