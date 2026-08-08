import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { fetchWithX402Payment } from "../lib/x402.js";

export function registerInvokeTools(server: McpServer) {
  server.tool(
    "invoke_x402_route",
    "Invoke a JSON x402 route (GET/POST). Call discover_service first. For multipart/binary use store_file or retrieve_file.",
    {
      endpoint: z.string().describe("Full endpoint URL from discover_service"),
      method: z.enum(["GET", "POST"]).default("POST"),
      body: z.record(z.string(), z.unknown()).optional().describe("JSON body for POST requests"),
    },
    async ({ endpoint, method, body }) => {
      try {
        const res = await fetchWithX402Payment(endpoint, {
          method,
          headers: method === "POST" ? { "Content-Type": "application/json" } : undefined,
          body: method === "POST" && body ? JSON.stringify(body) : undefined,
        });

        if (!res.ok) {
          const text = await res.text().catch(() => `HTTP ${res.status}`);
          return {
            content: [{ type: "text" as const, text: `x402 request failed (${res.status}): ${text}` }],
            isError: true,
          };
        }

        const text = await res.text();
        return { content: [{ type: "text" as const, text }] };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return { content: [{ type: "text" as const, text: `invoke_x402_route failed: ${msg}` }], isError: true };
      }
    },
  );
}
