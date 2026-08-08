/**
 * erc8004Provider.ts — ERC-8004 discovery, health checks, x402 route invocation, reputation.
 */

import { tool } from "ai";
import { z } from "zod";
import { createPublicClient, createWalletClient, http, type Address } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { x402Client, wrapFetchWithPayment } from "@x402/fetch";
import { toClientEvmSigner } from "@x402/evm";
import { registerExactEvmScheme } from "@x402/evm/exact/client";
import type { WalletProvider } from "@coinbase/agentkit";
import { EvmWalletProvider } from "@coinbase/agentkit";
import {
  blockExplorerOrigin,
  CDP_NETWORK_BASE_MAINNET,
  CDP_NETWORK_BASE_SEPOLIA,
  defaultPublicRpc,
  normalizeCdpNetworkId,
  viemChainForCdpNetwork,
} from "../network-config";
import type { TurnWorkflowState } from "../workflow-state";
import {
  discoverOnChainService,
  formatDiscoveryJson,
  LEGACY_CAPABILITY_ALIASES,
  verifyServiceHealth,
} from "@/lib/agent/erc8004-discovery";
import { AgentIdentityABI as MainnetIdentityABI } from "../../../ABI/mainnet/AgentIdentityABI.js";
import { AgentReputationABI as MainnetReputationABI } from "../../../ABI/mainnet/AgentReputationABI.js";
import { AgentIdentityABI as TestnetIdentityABI } from "../../../ABI/testnet/AgentIdentityABI.js";
import { AgentReputationABI as TestnetReputationABI } from "../../../ABI/testnet/AgentReputationABI.js";

const DEFAULT_IDENTITY_MAINNET =
  "0x2Ad463E1f6783e610504A1027D6AdE8b2DcF10b2" as Address;
const DEFAULT_REPUTATION_MAINNET =
  "0x96EE446A832b7AdcF598C4B2340131f622677c25" as Address;
const DEFAULT_IDENTITY_SEPOLIA =
  "0x1352abA587fFbbC398d7ecAEA31e2948D3aFE4Fb" as Address;
const DEFAULT_REPUTATION_SEPOLIA =
  "0x3FdD300147940a35F32AdF6De36b3358DA682B5c" as Address;

/** Legacy aliases → capability tags */
const CAPABILITY_ALIASES = LEGACY_CAPABILITY_ALIASES;

function resolveErc8004Mode(networkIdFromWallet?: string): "mainnet" | "testnet" {
  const env = process.env.ERC8004_NETWORK?.toLowerCase();
  if (env === "mainnet") return "mainnet";
  if (env === "testnet") return "testnet";

  const nid = (
    networkIdFromWallet ||
    process.env.NETWORK_ID ||
    "base-sepolia"
  ).toLowerCase();
  if (nid === "base-sepolia") return "testnet";
  if (nid === "base-mainnet" || nid === "base") return "mainnet";

  const reg = (process.env.ERC8004_IDENTITY_REGISTRY || "").toLowerCase();
  if (reg === DEFAULT_IDENTITY_MAINNET.toLowerCase()) return "mainnet";
  return "testnet";
}

function registryAddresses(mode: "mainnet" | "testnet"): {
  identity: Address;
  reputation: Address;
} {
  const identity =
    (process.env.ERC8004_IDENTITY_REGISTRY as Address | undefined) ||
    (mode === "mainnet" ? DEFAULT_IDENTITY_MAINNET : DEFAULT_IDENTITY_SEPOLIA);
  const reputation =
    (process.env.ERC8004_REPUTATION_REGISTRY as Address | undefined) ||
    (mode === "mainnet" ? DEFAULT_REPUTATION_MAINNET : DEFAULT_REPUTATION_SEPOLIA);
  if (!identity?.startsWith("0x") || !reputation?.startsWith("0x")) {
    throw new Error(
      "Set ERC8004_IDENTITY_REGISTRY and ERC8004_REPUTATION_REGISTRY in .env",
    );
  }
  return { identity, reputation };
}

function createX402Fetch(walletProvider: WalletProvider) {
  if (!(walletProvider instanceof EvmWalletProvider)) {
    throw new Error("invokeX402Route requires EvmWalletProvider");
  }
  const signer = walletProvider.toSigner();
  const publicClient = walletProvider.getPublicClient();
  const smartWalletAddress = walletProvider.getAddress() as `0x${string}`;
  const signerForSmartWallet = { ...signer, address: smartWalletAddress };
  const clientEvmSigner = toClientEvmSigner(
    signerForSmartWallet as typeof signer,
    publicClient,
  );
  const client = new x402Client();
  registerExactEvmScheme(client, { signer: clientEvmSigner });
  return wrapFetchWithPayment(fetch, client);
}

export function getERC8004Tools(
  networkIdFromWallet?: string,
  options?: { walletProvider?: WalletProvider; workflow?: TurnWorkflowState },
) {
  const mode = resolveErc8004Mode(networkIdFromWallet);
  const { identity: IDENTITY_REGISTRY, reputation: REPUTATION_REGISTRY } =
    registryAddresses(mode);
  const IDENTITY_ABI =
    mode === "mainnet" ? MainnetIdentityABI : TestnetIdentityABI;
  const REPUTATION_ABI =
    mode === "mainnet" ? MainnetReputationABI : TestnetReputationABI;

  const registryNetworkId =
    mode === "mainnet" ? CDP_NETWORK_BASE_MAINNET : CDP_NETWORK_BASE_SEPOLIA;
  const walletNi = normalizeCdpNetworkId(networkIdFromWallet);
  if (walletNi !== registryNetworkId) {
    console.warn(
      `[ERC-8004] CDP NETWORK_ID (${walletNi}) does not match registry chain (${registryNetworkId}).`,
    );
  }

  const chain = viemChainForCdpNetwork(registryNetworkId);
  const RPC_URL =
    process.env.BASE_RPC_URL ||
    process.env.RPC_URL ||
    defaultPublicRpc(registryNetworkId);
  const explorerTxBase = `${blockExplorerOrigin(registryNetworkId)}/tx/`;
  const workflow = options?.workflow;
  const walletProvider = options?.walletProvider;

  const publicClient = createPublicClient({
    transport: http(RPC_URL),
    chain,
  });

  async function getReputation(
    addr: Address,
  ): Promise<{ score: number; totalRatings: number }> {
    try {
      const [score, totalRatings] = (await publicClient.readContract({
        address: REPUTATION_REGISTRY,
        abi: REPUTATION_ABI,
        functionName: "getReputationScore",
        args: [addr],
      })) as [bigint, bigint];
      return {
        score: Number(score) / 100,
        totalRatings: Number(totalRatings),
      };
    } catch {
      return { score: 0, totalRatings: 0 };
    }
  }

  return {
    listCapabilities: tool({
      description: `List known capability tags to query via discoverService.
Legacy aliases: analyze, store, retrieve. Any registered tag also works (e.g. marine-dataset).`,
      inputSchema: z.object({}),
      execute: async (): Promise<string> => {
        const known = [
          "csv-analysis",
          "file-storage",
          "statistics",
          "data-transformation",
          "ipfs",
          "decentralized-storage",
        ];
        return JSON.stringify({
          legacyAliases: Object.keys(CAPABILITY_ALIASES),
          suggestedTags: known,
          hint: "Call discoverService with any tag registered on-chain.",
        });
      },
    }),

    discoverService: tool({
      description: `Discover on-chain registered service agents for a capability via ERC-8004.
ALWAYS call this FIRST before any payment. Returns endpoint, price, payTo, routes, reputation.
Accepts legacy keys (analyze, store, retrieve) or any capability tag.`,
      inputSchema: z.object({
        capability: z
          .string()
          .describe(
            "Capability tag or legacy alias: analyze | store | retrieve | csv-analysis | file-storage | custom tag",
          ),
        routePath: z
          .string()
          .optional()
          .describe("Optional route path e.g. /analyze, /upload, /query"),
      }),
      execute: async ({ capability, routePath }): Promise<string> => {
        try {
          const result = await discoverOnChainService(
            capability,
            networkIdFromWallet,
            routePath,
          );
          if (!result.found) return result.error;
          if (workflow) workflow.agenta.discovered = true;
          return formatDiscoveryJson(result);
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          return `Discovery failed: ${message}`;
        }
      },
    }),

    verifyServiceHealth: tool({
      description: `GET /health on a discovered service endpoint base URL before paying.`,
      inputSchema: z.object({
        endpoint: z
          .string()
          .describe("Full route URL or base URL (health checked at /health on origin)"),
      }),
      execute: async ({ endpoint }): Promise<string> => {
        const result = await verifyServiceHealth(endpoint);
        return JSON.stringify(result);
      },
    }),

    invokeX402Route: tool({
      description: `Invoke a JSON x402 route (POST/GET). For multipart/binary use paidStoreFile or paidRetrieveFile.
Call discoverService first. Body must be JSON-serializable.`,
      inputSchema: z.object({
        endpoint: z.string(),
        method: z.enum(["GET", "POST"]).default("POST"),
        body: z.record(z.string(), z.unknown()).optional(),
      }),
      execute: async ({ endpoint, method, body }): Promise<string> => {
        if (!walletProvider) {
          return "invokeX402Route requires wallet provider (AgentA only)";
        }
        try {
          const fetchWithPayment = createX402Fetch(walletProvider);
          const init: RequestInit = {
            method,
            headers: method === "POST" ? { "Content-Type": "application/json" } : undefined,
            body: method === "POST" && body ? JSON.stringify(body) : undefined,
          };
          const res = await fetchWithPayment(endpoint, init);
          if (!res.ok) {
            const text = await res.text().catch(() => `HTTP ${res.status}`);
            return `x402 request failed (${res.status}): ${text}`;
          }
          const text = await res.text();
          if (workflow) workflow.agenta.paidTaskSucceeded = true;
          try {
            return JSON.stringify({ success: true, data: JSON.parse(text) });
          } catch {
            return JSON.stringify({ success: true, data: text.slice(0, 2000) });
          }
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          return `invokeX402Route failed: ${message}`;
        }
      },
    }),

    checkCanRate: tool({
      description: `Check ERC-8004 rate limit before postReputation.`,
      inputSchema: z.object({
        targetAgentAddress: z.string(),
        raterAddress: z.string(),
      }),
      execute: async ({ targetAgentAddress, raterAddress }): Promise<string> => {
        try {
          const [allowed, nextAllowedTime] = (await publicClient.readContract({
            address: REPUTATION_REGISTRY,
            abi: REPUTATION_ABI,
            functionName: "canRate",
            args: [raterAddress as Address, targetAgentAddress as Address],
          })) as [boolean, bigint];

          if (allowed) {
            if (workflow) workflow.agenta.checkCanRatePassed = true;
            return JSON.stringify({
              canRate: true,
              message: "✅ Rate limit OK — proceed with postReputation.",
            });
          }
          const cooldownEnd = new Date(
            Number(nextAllowedTime) * 1000,
          ).toLocaleString();
          return JSON.stringify({
            canRate: false,
            nextAllowedTime: Number(nextAllowedTime),
            message: `⏭️ Reputation skipped — rate limit active until ${cooldownEnd}.`,
          });
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          return JSON.stringify({ canRate: false, error: message });
        }
      },
    }),

    postReputation: tool({
      description: `Post on-chain reputation after successful paid task. Requires checkCanRate + prior x402 success.`,
      inputSchema: z.object({
        targetAgentAddress: z.string(),
        rating: z.number().int().min(1).max(5),
        comment: z.string(),
        proofCID: z.string(),
      }),
      execute: async ({
        targetAgentAddress,
        rating,
        comment,
        proofCID,
      }): Promise<string> => {
        if (workflow && !workflow.agenta.paidTaskSucceeded) {
          return "Blocked: postReputation requires a successful x402 task in this turn first.";
        }
        if (workflow && !workflow.agenta.checkCanRatePassed) {
          return "Blocked: call checkCanRate first and only post when canRate is true.";
        }

        try {
          const privateKey = process.env.AGENT_A_PRIVATE_KEY as `0x${string}`;
          if (!privateKey) {
            return "AGENT_A_PRIVATE_KEY not set — cannot sign reputation transaction";
          }

          const account = privateKeyToAccount(privateKey);
          const walletClient = createWalletClient({
            chain,
            transport: http(RPC_URL),
            account,
          });

          const hash = await walletClient.writeContract({
            chain,
            address: REPUTATION_REGISTRY,
            abi: REPUTATION_ABI,
            functionName: "postReputation",
            args: [
              targetAgentAddress as Address,
              Math.min(5, Math.max(1, Math.floor(rating))),
              comment,
              proofCID,
            ],
            account,
          });

          await publicClient.waitForTransactionReceipt({ hash });
          return JSON.stringify({
            success: true,
            txHash: hash,
            baseScanUrl: `${explorerTxBase}${hash}`,
            message: `⭐ Reputation posted on-chain! ${rating}/5`,
          });
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          if (message.includes("RateLimitExceeded")) {
            return "⏭️ RateLimitExceeded — reputation skipped. Task still succeeded.";
          }
          return `postReputation failed: ${message}`;
        }
      },
    }),

    getAgentReputation: tool({
      description: "Read on-chain reputation score for any registered agent.",
      inputSchema: z.object({
        agentAddress: z.string(),
      }),
      execute: async ({ agentAddress }): Promise<string> => {
        const rep = await getReputation(agentAddress as Address);
        return `${rep.score.toFixed(1)}/5 from ${rep.totalRatings} ratings`;
      },
    }),
  };
}

/** Exported for SDG on-chain delegate */
export async function discoverServiceForDelegate(
  capability: string,
  networkId?: string,
  routePath?: string,
): Promise<Record<string, unknown>> {
  const result = await discoverOnChainService(capability, networkId, routePath);
  if (!result.found) return { found: false, error: result.error };
  return {
    found: true,
    agentAddress: result.agentAddress,
    serviceName: result.serviceName,
    endpoint: result.endpoint,
    price: `$${result.price} USDC`,
    payTo: result.payTo,
    capability: result.capability,
    cardCID: result.cardCID,
  };
}
