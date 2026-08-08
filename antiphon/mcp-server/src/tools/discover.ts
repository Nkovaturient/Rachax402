import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  discoverBestAgent,
  getReputation,
  listRegisteredCapabilities,
} from "../lib/erc8004.js";
import type { Address } from "viem";

export function registerDiscoverTools(server: McpServer) {
  server.tool(
    "discover_service",
    "Query ERC-8004 for a capability tag or legacy alias (analyze, store, retrieve). Returns endpoint, price, reputation.",
    {
      capability: z.string().describe("Capability tag or legacy alias"),
      routePath: z.string().optional().describe("Optional route e.g. /analyze, /query"),
    },
    async ({ capability, routePath }) => {
      try {
        const result = await discoverBestAgent(capability, routePath);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return { content: [{ type: "text" as const, text: `Discovery failed: ${msg}` }], isError: true };
      }
    },
  );

  server.tool(
    "list_capabilities",
    "Scan on-chain registry for capability tags that have at least one registered agent.",
    {},
    async () => {
      try {
        const tags = await listRegisteredCapabilities();
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ capabilities: tags, legacyAliases: ["analyze", "store", "retrieve"] }, null, 2),
            },
          ],
        };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return { content: [{ type: "text" as const, text: msg }], isError: true };
      }
    },
  );

  server.tool(
    "get_agent_reputation",
    "Read on-chain reputation score for a registered agent address.",
    { agentAddress: z.string().describe("Agent wallet address (0x...)") },
    async ({ agentAddress }) => {
      const rep = await getReputation(agentAddress as Address);
      return {
        content: [
          { type: "text" as const, text: `${rep.score.toFixed(1)}/5 from ${rep.totalRatings} ratings` },
        ],
      };
    },
  );
}
