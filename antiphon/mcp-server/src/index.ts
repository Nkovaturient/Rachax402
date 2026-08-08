#!/usr/bin/env node
/**
 * @antiphon/mcp-server — ERC-8004 discovery, x402 payments, Pinata IPFS staging.
 * Transport: stdio (Cursor, Claude Desktop, any MCP client)
 *
 * Env: RACHAX402_PRIVATE_KEY, PINATA_JWT, PINATA_GATEWAY, BASE_RPC_URL,
 *      ERC8004_IDENTITY_REGISTRY, ERC8004_REPUTATION_REGISTRY, X402_NETWORK=eip155:84532
 */

import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerDiscoverTools } from "./tools/discover.js";
import { registerAnalyzeTools } from "./tools/analyze.js";
import { registerStorageTools } from "./tools/storage.js";
import { registerReputationTools } from "./tools/reputation.js";
import { registerInvokeTools } from "./tools/invoke.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "..", ".env") });

const server = new McpServer({
  name: "antiphon",
  version: "0.2.0",
});

registerDiscoverTools(server);
registerAnalyzeTools(server);
registerStorageTools(server);
registerReputationTools(server);
registerInvokeTools(server);

const transport = new StdioServerTransport();
await server.connect(transport);
