/**
 * create-agent.ts — Rachax402 Agent Orchestrator
 *
 * AgentA: autonomous on-chain services via AgentKit + ERC-8004 + x402 + Storacha.
 * SDG agents: research-only, shared SDG toolkit, no blockchain coupling.
 */

import { anthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { getVercelAITools } from "@coinbase/agentkit-vercel-ai-sdk";
import { jsonSchema } from "ai";
import { prepareAgentkitAndWalletProvider } from "./prepare-agentkit";
import { normalizeCdpNetworkId } from "./network-config";
import { getERC8004Tools } from "./providers/erc8004Provider";
import { getStorachaTools } from "./providers/storachaProvider";
import { getSdgToolkitTools } from "./providers/sdgToolkitProvider";
import { getSystemPromptBlock, isSdgSlug } from "@/lib/data/registry";
import { getAgentaBasePrompt } from "./system-prompts/agenta";
import { getSdgBasePrompt } from "./system-prompts/sdg-base";

/**
 * Converts AgentKit tools from AI SDK v4 format (`parameters`) to v5 format (`inputSchema`).
 *
 * getVercelAITools() returns tools built against AI SDK v4 where schemas live in `parameters`
 * (a plain JSON Schema object). AI SDK v5's Anthropic provider reads only `inputSchema`,
 * so tools without it produce `input_schema.type: Field required` from the Anthropic API.
 *
 * We also fix any broken `type` field (e.g. "None" or "undefined") to "object".
 * For ERC20ActionProvider_get_balance: remove `address` from schema so the default (Smart Wallet) is used.
 */
function sanitizeAgentKitTools(
  rawTools: Record<string, unknown>
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [name, rawTool] of Object.entries(rawTools)) {
    const t = rawTool as Record<string, unknown>;

    // Only process v4-format tools that have `parameters` but no `inputSchema`
    if (!("parameters" in t) || "inputSchema" in t) {
      sanitized[name] = rawTool;
      continue;
    }

    const params = t.parameters as Record<string, unknown> | undefined | null;
    const paramType = params && typeof params === "object" ? params.type : undefined;
    const needsFix = typeof paramType !== "string" || paramType !== "object";

    let base = typeof params === "object" && params !== null ? { ...params } : {};
    if (needsFix) {
      console.log(`[AgentKit schema fix] ${name}: replaced parameters.type="${String(paramType)}" → "object"`);
    }

    if (name === "ERC20ActionProvider_get_balance") {
      const props = (base.properties as Record<string, unknown>) || {};
      delete props.address;
      base = { ...base, properties: props };
      const required = Array.isArray(base.required) ? base.required.filter((r: unknown) => r !== "address") : base.required;
      if (required) base = { ...base, required };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sanitized[name] = { ...t, inputSchema: jsonSchema({ ...base, type: "object" } as any) };
  }

  return sanitized;
}

type Agent = {
  tools: Record<string, unknown>;
  system: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: any;
  maxSteps: number;
};

const agentCache = new Map<string, Agent>();

/** DeepSeek API model id (sent on the wire). */
const DEEPSEEK_CHAT_MODEL = "deepseek-chat";

/**
 * @ai-sdk/openai treats any model id outside gpt-3/gpt-4/chatgpt-4o/gpt-5-chat as a
 * "reasoning" model and maps system → role "developer". DeepSeek only accepts "system".
 * Using gpt-4 here selects system mode; the custom fetch rewrites model to DeepSeek.
 */
const DEEPSEEK_OPENAI_COMPAT_MODEL_ID = "gpt-4";

function createDeepSeekProvider() {
  return createOpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: "https://api.deepseek.com/v1",
    name: "deepseek",
    fetch: async (input, init) => {
      if (init?.body && typeof init.body === "string") {
        try {
          const body = JSON.parse(init.body) as {
            model?: string;
            messages?: Array<{ role?: string }>;
          };
          let patched = false;

          if (body.model === DEEPSEEK_OPENAI_COMPAT_MODEL_ID) {
            body.model = DEEPSEEK_CHAT_MODEL;
            patched = true;
          }

          if (body.messages?.some((m) => m.role === "developer")) {
            body.messages = body.messages.map((m) =>
              m.role === "developer" ? { ...m, role: "system" } : m,
            );
            patched = true;
          }

          if (patched) {
            init = { ...init, body: JSON.stringify(body) };
          }
        } catch {
          // non-JSON body — pass through
        }
      }
      return fetch(input, init);
    },
  });
}

async function createAgentaAgent(): Promise<Agent> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY required in .env");
  }

  const { agentkit, walletProvider } = await prepareAgentkitAndWalletProvider();
  const network = walletProvider.getNetwork();
  const cdpNetworkId = normalizeCdpNetworkId(network.networkId);
  const smartWalletAddress = walletProvider.getAddress();

  const erc8004Identity =
    process.env.ERC8004_IDENTITY_REGISTRY ||
    "0x1352abA587fFbbC398d7ecAEA31e2948D3aFE4Fb";
  const erc8004Reputation =
    process.env.ERC8004_REPUTATION_REGISTRY ||
    "0x3FdD300147940a35F32AdF6De36b3358DA682B5c";

  const system = getAgentaBasePrompt({
    cdpNetworkId,
    smartWalletAddress,
    erc8004Identity,
    erc8004Reputation,
  });

  const overlay = getSystemPromptBlock("agenta");
  const fullSystem = overlay ? `${system}\n\n${overlay}` : system;

  const rawAgentKitTools = getVercelAITools(agentkit);

  console.log("[AgentKit tools] Before sanitizing:");
  for (const [name, t] of Object.entries(rawAgentKitTools)) {
    const paramType = (t as any)?.parameters?.type;
    if (paramType !== "object" && paramType !== undefined) {
      console.log(`  ⚠ ${name}: parameters.type = "${paramType}"`);
    }
  }

  const agentKitTools = sanitizeAgentKitTools(rawAgentKitTools);
  const erc8004Tools = getERC8004Tools(cdpNetworkId);
  const storachaTools = getStorachaTools(walletProvider);

  const tools = {
    ...agentKitTools,
    ...erc8004Tools,
    ...storachaTools,
  };

  return {
    model: anthropic("claude-sonnet-4-6"),
    system: fullSystem,
    tools,
    maxSteps: 15,
  };
}

async function createSdgAgent(slug: string): Promise<Agent> {
  if (!process.env.DEEPSEEK_API_KEY) {
    throw new Error("DEEPSEEK_API_KEY required in .env");
  }

  const deepseek = createDeepSeekProvider();

  const basePrompt = getSdgBasePrompt();
  const overlay = getSystemPromptBlock(slug);
  const fullSystem = overlay ? `${basePrompt}\n\n${overlay}` : basePrompt;

  const tools = getSdgToolkitTools({ agentSlug: slug });

  return {
    model: deepseek.chat(DEEPSEEK_OPENAI_COMPAT_MODEL_ID),
    system: fullSystem,
    tools,
    maxSteps: 12,
  };
}

export async function createAgent(options?: {
  agentSlug?: string;
}): Promise<Agent> {
  const slug = options?.agentSlug ?? "agenta";
  const cached = agentCache.get(slug);
  if (cached) return cached;

  let agent: Agent;

  if (isSdgSlug(slug)) {
    agent = await createSdgAgent(slug);
  } else {
    agent = await createAgentaAgent();
  }

  agentCache.set(slug, agent);
  return agent;
}
