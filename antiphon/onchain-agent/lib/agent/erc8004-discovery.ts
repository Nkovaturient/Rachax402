/**
 * Shared ERC-8004 service discovery (used by AgentA tools + SDG delegate).
 */

import { createPublicClient, http, type Address } from "viem";
import {
  CDP_NETWORK_BASE_MAINNET,
  CDP_NETWORK_BASE_SEPOLIA,
  defaultPublicRpc,
  normalizeCdpNetworkId,
  viemChainForCdpNetwork,
} from "@/app/api/agent/network-config";
import { ipfsGatewayUrl } from "@/lib/ipfs-gateway";
import { AgentIdentityABI as MainnetIdentityABI } from "@/app/ABI/mainnet/AgentIdentityABI.js";
import { AgentReputationABI as MainnetReputationABI } from "@/app/ABI/mainnet/AgentReputationABI.js";
import { AgentIdentityABI as TestnetIdentityABI } from "@/app/ABI/testnet/AgentIdentityABI.js";
import { AgentReputationABI as TestnetReputationABI } from "@/app/ABI/testnet/AgentReputationABI.js";

const DEFAULT_IDENTITY_MAINNET =
  "0x2Ad463E1f6783e610504A1027D6AdE8b2DcF10b2" as Address;
const DEFAULT_REPUTATION_MAINNET =
  "0x96EE446A832b7AdcF598C4B2340131f622677c25" as Address;
const DEFAULT_IDENTITY_SEPOLIA =
  "0x1352abA587fFbbC398d7ecAEA31e2948D3aFE4Fb" as Address;
const DEFAULT_REPUTATION_SEPOLIA =
  "0x3FdD300147940a35F32AdF6De36b3358DA682B5c" as Address;

export const LEGACY_CAPABILITY_ALIASES: Record<
  string,
  { tag: string; routePath: string; pricingKey: string }
> = {
  analyze: { tag: "csv-analysis", routePath: "/analyze", pricingKey: "baseRate" },
  store: { tag: "file-storage", routePath: "/upload", pricingKey: "upload" },
  retrieve: { tag: "file-storage", routePath: "/retrieve", pricingKey: "retrieve" },
};

const IS_DEV = process.env.NODE_ENV !== "production";
const LOCAL_ANALYZER_URL = (process.env.LOCAL_ANALYZER_URL || "http://localhost:8001").replace(/\/$/, "");
const LOCAL_STORAGE_URL = (process.env.LOCAL_STORAGE_URL || "http://localhost:8000").replace(/\/$/, "");

/** Dev mode: registered agent cards point at (possibly down) Railway hosts — route to local servers instead. */
function localEndpointOverride(tag: string, routePath: string): string | null {
  if (!IS_DEV) return null;
  const base = tag === "csv-analysis" ? LOCAL_ANALYZER_URL : LOCAL_STORAGE_URL;
  return `${base}${routePath}`;
}

type AgentCard = {
  name?: string;
  endpoint?: string;
  walletAddress?: string;
  pricing?: Record<string, number>;
  x402?: {
    routes?: Array<{ method: string; path: string; price?: string }>;
  };
};

export type DiscoveryResult =
  | { found: false; error: string }
  | {
      found: true;
      agentAddress: Address;
      serviceName: string;
      endpoint: string;
      price: number;
      payTo: string;
      reputation: number;
      totalRatings: number;
      capability: string;
      cardCID: string;
      routes: Array<{ method: string; path: string; price?: string }>;
      routePath: string;
    };

function resolveMode(networkIdFromWallet?: string): "mainnet" | "testnet" {
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

function registryAddresses(mode: "mainnet" | "testnet") {
  const identity =
    (process.env.ERC8004_IDENTITY_REGISTRY as Address | undefined) ||
    (mode === "mainnet" ? DEFAULT_IDENTITY_MAINNET : DEFAULT_IDENTITY_SEPOLIA);
  const reputation =
    (process.env.ERC8004_REPUTATION_REGISTRY as Address | undefined) ||
    (mode === "mainnet" ? DEFAULT_REPUTATION_MAINNET : DEFAULT_REPUTATION_SEPOLIA);
  return { identity, reputation };
}

function resolveRouteFromCard(
  card: AgentCard,
  routePath?: string,
  pricingKey?: string,
): { endpoint: string; price: number; routePath: string } {
  const cardEndpoint = (card.endpoint ?? "").replace(/\/$/, "");
  const baseUrl = cardEndpoint.replace(/\/(upload|analyze|retrieve|query)$/, "");
  const routes = card.x402?.routes ?? [];
  const matched = routePath
    ? routes.find((r) => r.path === routePath)
    : routes[0];

  const resolvedPath = matched?.path ?? routePath ?? "/";
  const endpoint = `${baseUrl}${resolvedPath}`;

  let price = 0.01;
  if (pricingKey && card.pricing?.[pricingKey] != null) {
    price = card.pricing[pricingKey]!;
  } else if (matched?.price) {
    price = parseFloat(matched.price.replace("$", "")) || 0.01;
  } else if (card.pricing?.baseRate != null) {
    price = card.pricing.baseRate;
  }

  return { endpoint, price, routePath: resolvedPath };
}

export async function verifyServiceHealth(endpoint: string): Promise<{
  healthy: boolean;
  status?: number;
  url?: string;
  service?: string;
  error?: string;
}> {
  try {
    const origin = endpoint.replace(/\/(upload|analyze|retrieve|query).*$/, "");
    const healthUrl = `${origin.replace(/\/$/, "")}/health`;
    const res = await fetch(healthUrl, { signal: AbortSignal.timeout(8000) });
    const body = (await res.json().catch(() => ({}))) as { service?: string };
    return {
      healthy: res.ok,
      status: res.status,
      url: healthUrl,
      service: body.service ?? "unknown",
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { healthy: false, error: message };
  }
}

export async function discoverOnChainService(
  capabilityInput: string,
  networkIdFromWallet?: string,
  routePath?: string,
): Promise<DiscoveryResult> {
  const mode = resolveMode(networkIdFromWallet);
  const { identity: IDENTITY_REGISTRY } = registryAddresses(mode);
  const IDENTITY_ABI =
    mode === "mainnet" ? MainnetIdentityABI : TestnetIdentityABI;
  const REPUTATION_ABI =
    mode === "mainnet" ? MainnetReputationABI : TestnetReputationABI;
  const { reputation: REPUTATION_REGISTRY } = registryAddresses(mode);

  const registryNetworkId =
    mode === "mainnet" ? CDP_NETWORK_BASE_MAINNET : CDP_NETWORK_BASE_SEPOLIA;
  const chain = viemChainForCdpNetwork(registryNetworkId);
  const RPC_URL =
    process.env.BASE_RPC_URL ||
    process.env.RPC_URL ||
    defaultPublicRpc(registryNetworkId);

  const publicClient = createPublicClient({ transport: http(RPC_URL), chain });

  const alias = LEGACY_CAPABILITY_ALIASES[capabilityInput];
  const tag = alias?.tag ?? capabilityInput;

  let agents: Address[];
  if (mode === "mainnet") {
    const [page] = (await publicClient.readContract({
      address: IDENTITY_REGISTRY,
      abi: IDENTITY_ABI,
      functionName: "getAgentsByCapability",
      args: [tag, 0n, 100n],
    })) as [Address[], bigint];
    agents = page ?? [];
  } else {
    agents = (await publicClient.readContract({
      address: IDENTITY_REGISTRY,
      abi: IDENTITY_ABI,
      functionName: "getAgentsByCapability",
      args: [tag],
    })) as Address[];

    if (!agents?.length) {
      const [discovered] = (await publicClient.readContract({
        address: IDENTITY_REGISTRY,
        abi: IDENTITY_ABI,
        functionName: "discoverAgents",
        args: [[tag], 0n, 10n],
      })) as [Address[], bigint];
      agents = discovered || [];
    }
  }

  if (!agents?.length) {
    return { found: false, error: `No agents registered for capability: ${tag}` };
  }

  const withRep = await Promise.all(
    agents.map(async (addr) => {
      try {
        const [score, totalRatings] = (await publicClient.readContract({
          address: REPUTATION_REGISTRY,
          abi: REPUTATION_ABI,
          functionName: "getReputationScore",
          args: [addr],
        })) as [bigint, bigint];
        return { addr, score: Number(score) / 100, totalRatings: Number(totalRatings) };
      } catch {
        return { addr, score: 0, totalRatings: 0 };
      }
    }),
  );
  const best = withRep.sort((a, b) => b.score - a.score)[0]!;

  const cardCID = (await publicClient.readContract({
    address: IDENTITY_REGISTRY,
    abi: IDENTITY_ABI,
    functionName: "getAgentCard",
    args: [best.addr],
  })) as string;

  let card: AgentCard | null = null;
  try {
    const res = await fetch(ipfsGatewayUrl(cardCID), {
      signal: AbortSignal.timeout(15000),
    });
    if (res.ok) card = (await res.json()) as AgentCard;
  } catch {
    card = null;
  }

  const resolvedRoutePath = routePath ?? alias?.routePath;
  const resolvedPricingKey = alias?.pricingKey;

  if (card) {
    const { endpoint, price, routePath: rp } = resolveRouteFromCard(
      card,
      resolvedRoutePath,
      resolvedPricingKey,
    );
    return {
      found: true,
      agentAddress: best.addr,
      serviceName: card.name ?? "Service Provider",
      endpoint: localEndpointOverride(tag, rp) ?? endpoint,
      price,
      payTo: card.walletAddress ?? best.addr,
      reputation: best.score,
      totalRatings: best.totalRatings,
      capability: tag,
      cardCID,
      routes: card.x402?.routes ?? [],
      routePath: rp,
    };
  }

  const fallbackBase =
    capabilityInput === "analyze" || tag === "csv-analysis"
      ? "https://rachax402-analyzer-service.up.railway.app"
      : "https://rachax402-storacha-service.up.railway.app";
  const suffix = resolvedRoutePath ?? "/analyze";

  return {
    found: true,
    agentAddress: best.addr,
    serviceName: "Service Provider (card unavailable)",
    endpoint: localEndpointOverride(tag, suffix) ?? `${fallbackBase}${suffix}`,
    price:
      resolvedPricingKey === "upload"
        ? 0.1
        : resolvedPricingKey === "retrieve"
          ? 0.005
          : 0.01,
    payTo: best.addr,
    reputation: best.score,
    totalRatings: best.totalRatings,
    capability: tag,
    cardCID,
    routes: [],
    routePath: suffix,
  };
}

export function formatDiscoveryJson(result: DiscoveryResult): string {
  if (!result.found) return result.error;
  return JSON.stringify({
    found: true,
    agentAddress: result.agentAddress,
    agentAddressTruncated: `${result.agentAddress.slice(0, 10)}...${result.agentAddress.slice(-8)}`,
    serviceName: result.serviceName,
    endpoint: result.endpoint,
    price: `$${result.price} USDC`,
    payTo: result.payTo,
    reputation: `${result.reputation}/5`,
    totalRatings: result.totalRatings,
    capability: result.capability,
    routes: result.routes,
    cardCID: result.cardCID,
    logLine: `Service: ${result.serviceName}\nEndpoint: ${result.endpoint}\nPrice: $${result.price} USDC`,
  });
}
