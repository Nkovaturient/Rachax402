/**
 * erc8004Provider.ts
 * Vercel AI SDK tools wrapping ERC-8004 on-chain registry for AgentKit.
 *
 * Exposes to Claude:
 *   discoverService(capability)                    → endpoint, price, walletAddress, reputation
 *   checkCanRate(targetAgentAddress, raterAddress) → rate-limit gate before postReputation
 *   postReputation(target, rating, comment, proofCID) → on-chain 1-5 rating
 *   getAgentReputation(agentAddress)               → score display
 *
 * Score math (from contract): reputation = Number(score) / 100
 * (SCORE_MULTIPLIER = 100, not 1e18 — confirmed from lean coordinator index.ts)
 *
 * Chain defaults: see ../network-config.ts (NETWORK_ID + ERC8004_* must describe the same Base environment).
 */

import { tool } from "ai";
import { z } from "zod";
import { createPublicClient, createWalletClient, http, type Address } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
  blockExplorerOrigin,
  CDP_NETWORK_BASE_MAINNET,
  CDP_NETWORK_BASE_SEPOLIA,
  defaultPublicRpc,
  normalizeCdpNetworkId,
  viemChainForCdpNetwork,
} from "../network-config";
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

const CAPABILITY_MAP: Record<
  string,
  { tag: string; endpointSuffix: string; pricingKey: string }
> = {
  analyze: {
    tag: "csv-analysis",
    endpointSuffix: "/analyze",
    pricingKey: "baseRate",
  },
  store: {
    tag: "file-storage",
    endpointSuffix: "/upload",
    pricingKey: "upload",
  },
  retrieve: {
    tag: "file-storage",
    endpointSuffix: "/retrieve",
    pricingKey: "retrieve",
  },
};

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

function registryAddresses(
  mode: "mainnet" | "testnet"
): { identity: Address; reputation: Address } {
  const identity =
    (process.env.ERC8004_IDENTITY_REGISTRY as Address | undefined) ||
    (mode === "mainnet" ? DEFAULT_IDENTITY_MAINNET : DEFAULT_IDENTITY_SEPOLIA);
  const reputation =
    (process.env.ERC8004_REPUTATION_REGISTRY as Address | undefined) ||
    (mode === "mainnet"
      ? DEFAULT_REPUTATION_MAINNET
      : DEFAULT_REPUTATION_SEPOLIA);
  if (!identity?.startsWith("0x") || !reputation?.startsWith("0x")) {
    throw new Error(
      "Set ERC8004_IDENTITY_REGISTRY and ERC8004_REPUTATION_REGISTRY in .env"
    );
  }
  return { identity, reputation };
}

export function getERC8004Tools(networkIdFromWallet?: string) {
  const mode = resolveErc8004Mode(networkIdFromWallet);
  const { identity: IDENTITY_REGISTRY, reputation: REPUTATION_REGISTRY } =
    registryAddresses(mode);
  const IDENTITY_ABI =
    mode === "mainnet" ? MainnetIdentityABI : TestnetIdentityABI;
  const REPUTATION_ABI =
    mode === "mainnet" ? MainnetReputationABI : TestnetReputationABI;

  const registryNetworkId =
    mode === "mainnet"
      ? CDP_NETWORK_BASE_MAINNET
      : CDP_NETWORK_BASE_SEPOLIA;
  const walletNi = normalizeCdpNetworkId(networkIdFromWallet);
  if (walletNi !== registryNetworkId) {
    console.warn(
      `[ERC-8004] CDP NETWORK_ID (${walletNi}) does not match registry chain (${registryNetworkId}). ` +
        "Set NETWORK_ID and ERC8004_* to the same Base environment or x402 payments may fail."
    );
  }

  const chain = viemChainForCdpNetwork(registryNetworkId);
  const RPC_URL =
    process.env.BASE_RPC_URL ||
    process.env.RPC_URL ||
    defaultPublicRpc(registryNetworkId);
  const explorerTxBase = `${blockExplorerOrigin(registryNetworkId)}/tx/`;

  const publicClient = createPublicClient({
    transport: http(RPC_URL),
    chain,
  });

  async function getAgentsForCapability(
    capability: string
  ): Promise<Address[]> {
    const config = CAPABILITY_MAP[capability];
    if (!config) throw new Error(`Unknown capability: ${capability}`);

    if (mode === "mainnet") {
      const [page] = (await publicClient.readContract({
        address: IDENTITY_REGISTRY,
        abi: IDENTITY_ABI,
        functionName: "getAgentsByCapability",
        args: [config.tag, 0n, 100n],
      })) as [Address[], bigint];
      return page ?? [];
    }

    const agents = (await publicClient.readContract({
      address: IDENTITY_REGISTRY,
      abi: IDENTITY_ABI,
      functionName: "getAgentsByCapability",
      args: [config.tag],
    })) as Address[];
    return agents ?? [];
  }

  async function getReputation(
    addr: Address
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

  async function resolveAgentCard(
    cid: string
  ): Promise<Record<string, unknown> | null> {
    try {
      const res = await fetch(`https://w3s.link/ipfs/${cid}`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  return {
    discoverService: tool({
      description: `Discover on-chain registered service agents for a capability via ERC-8004.
ALWAYS call this FIRST — before any payment or task. It reads the blockchain registry and returns:
the service endpoint URL, price in USDC, the agent's wallet address (payTo), and on-chain reputation.

Available capabilities:
  'analyze'  → DataAnalyzer: CSV statistical analysis ($0.01 USDC per task)
  'store'    → StorachaStorage: IPFS file upload ($0.1 USDC)
  'retrieve' → StorachaStorage: IPFS file retrieval by CID ($0.005 USDC)`,
      inputSchema: z.object({
        capability: z
          .enum(["analyze", "store", "retrieve"])
          .describe(
            "Service type: 'analyze' for CSV stats, 'store' for IPFS upload, 'retrieve' for IPFS retrieval"
          ),
      }),
      execute: async ({
        capability,
      }: {
        capability: "analyze" | "store" | "retrieve";
      }): Promise<string> => {
        const config = CAPABILITY_MAP[capability];
        try {
          let agents = await getAgentsForCapability(capability);

          if (!agents || agents.length === 0) {
            const [discovered] = (await publicClient.readContract({
              address: IDENTITY_REGISTRY,
              abi: IDENTITY_ABI,
              functionName: "discoverAgents",
              args: [[config.tag], 0n, 10n],
            })) as [Address[], bigint];
            agents = discovered || [];
          }

          if (!agents || agents.length === 0) {
            return `No agents registered for capability: ${config.tag}. Run register-services.js first.`;
          }

          const withRep = await Promise.all(
            agents.map(async (addr) => ({
              addr,
              ...(await getReputation(addr)),
            }))
          );
          const best = withRep.sort((a, b) => b.score - a.score)[0];

          const cardCID = (await publicClient.readContract({
            address: IDENTITY_REGISTRY,
            abi: IDENTITY_ABI,
            functionName: "getAgentCard",
            args: [best.addr],
          })) as string;

          const card = await resolveAgentCard(cardCID);

          let endpoint: string;
          let price: number;
          let payTo: string;
          let agentName: string;

          if (card) {
            const baseUrl = (card.endpoint as string).replace(
              /\/(upload|analyze|retrieve)$/,
              ""
            );
            endpoint = `${baseUrl}${config.endpointSuffix}`;
            payTo = (card.walletAddress as string) || best.addr;
            price =
              (card.pricing as Record<string, number>)?.[config.pricingKey] ??
              (card.pricing as Record<string, number>)?.baseRate ??
              0.001;
            agentName = (card.name as string) || "Service Provider";
          } else {
            endpoint =
              capability === "analyze"
                ? `https://rachax402-analyzer-service.up.railway.app${config.endpointSuffix}`
                : `https://rachax402-storacha-service.up.railway.app${config.endpointSuffix}`;
            payTo = best.addr;
            price =
              config.pricingKey === "baseRate"
                ? 0.01
                : config.pricingKey === "upload"
                  ? 0.1
                  : 0.005;
            agentName = "Service Provider (card unavailable)";
          }

          return JSON.stringify({
            found: true,
            agentAddress: best.addr,
            agentAddressTruncated: `${best.addr.slice(0, 10)}...${best.addr.slice(-8)}`,
            serviceName: agentName,
            endpoint,
            price: `$${price} USDC`,
            payTo,
            reputation: `${best.score}/5`,
            totalRatings: best.totalRatings,
            capability: config.tag,
            logLine: `Service: ${agentName}\nEndpoint: ${endpoint}\nPrice: $${price} USDC\nPays to: ${payTo}`,
          });
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          return `Discovery failed: ${message}`;
        }
      },
    }),

    checkCanRate: tool({
      description: `Check if the ERC-8004 rate limit allows posting an on-chain reputation for an agent.
ALWAYS call this before postReputation to avoid RateLimitExceeded on-chain errors.
Returns canRate: true/false and when the cooldown ends if blocked.
The raterAddress is AgentA's CDP Smart Wallet address (get it with getWalletDetails tool).`,
      inputSchema: z.object({
        targetAgentAddress: z
          .string()
          .describe("Wallet address of the AgentB to rate (0x...)"),
        raterAddress: z
          .string()
          .describe(
            "AgentA's CDP Smart Wallet address that will submit the rating (0x...)"
          ),
      }),
      execute: async ({
        targetAgentAddress,
        raterAddress,
      }: {
        targetAgentAddress: string;
        raterAddress: string;
      }): Promise<string> => {
        try {
          const [allowed, nextAllowedTime] = (await publicClient.readContract({
            address: REPUTATION_REGISTRY,
            abi: REPUTATION_ABI,
            functionName: "canRate",
            args: [raterAddress as Address, targetAgentAddress as Address],
          })) as [boolean, bigint];

          if (allowed) {
            return JSON.stringify({
              canRate: true,
              message: "✅ Rate limit OK — proceed with postReputation.",
            });
          }
          const cooldownEnd = new Date(
            Number(nextAllowedTime) * 1000
          ).toLocaleString();
          return JSON.stringify({
            canRate: false,
            nextAllowedTime: Number(nextAllowedTime),
            message: `⏭️ Reputation skipped — rate limit active until ${cooldownEnd}. Task still succeeded.`,
          });
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          return JSON.stringify({ canRate: false, error: message });
        }
      },
    }),

    postReputation: tool({
      description: `Post an on-chain reputation rating for an AgentB after successful task completion.
ONLY call this if checkCanRate returned canRate: true. Never call if canRate returned false.
Always use rating=5 for successful service delivery.
proofCID is the IPFS CID of the task result — the resultCID from analysis or the file CID from storage.
Uses AGENT_A_PRIVATE_KEY env var to sign the transaction (EOA, not CDP Smart Wallet).`,
      inputSchema: z.object({
        targetAgentAddress: z.string().describe("AgentB wallet address to rate"),
        rating: z
          .number()
          .int()
          .min(1)
          .max(5)
          .describe("Rating 1-5 (use 5 for successful delivery)"),
        comment: z
          .string()
          .describe("Short description e.g. 'CSV analysis delivered accurately'"),
        proofCID: z
          .string()
          .describe("IPFS CID of the result as verifiable proof"),
      }),
      execute: async ({
        targetAgentAddress,
        rating,
        comment,
        proofCID,
      }: {
        targetAgentAddress: string;
        rating: number;
        comment: string;
        proofCID: string;
      }): Promise<string> => {
        try {
          const privateKey = process.env.AGENT_A_PRIVATE_KEY as `0x${string}`;
          if (!privateKey)
            return "AGENT_A_PRIVATE_KEY not set — cannot sign reputation transaction";

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
            message: `⭐ Reputation posted on-chain! ${rating}/5 for ${targetAgentAddress.slice(0, 10)}...\nTx: ${hash}`,
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
      description:
        "Read on-chain reputation score and rating count for any registered AgentB.",
      inputSchema: z.object({
        agentAddress: z.string().describe("Agent wallet address (0x...)"),
      }),
      execute: async ({
        agentAddress,
      }: {
        agentAddress: string;
      }): Promise<string> => {
        const rep = await getReputation(agentAddress as Address);
        return `${rep.score.toFixed(1)}/5 from ${rep.totalRatings} ratings`;
      },
    }),
  };
}
