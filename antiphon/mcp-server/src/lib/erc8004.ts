import { createPublicClient, http, type Address } from "viem";
import { baseSepolia } from "viem/chains";
import {
  IDENTITY_REGISTRY,
  REPUTATION_REGISTRY,
  RPC_URL,
  LEGACY_CAPABILITY_ALIASES,
} from "./contracts.js";
import { ipfsGatewayUrl } from "./pinata.js";
import { AgentIdentityABI as IDENTITY_ABI } from "./abi/AgentIdentityABI.js";
import { AgentReputationABI as REPUTATION_ABI } from "./abi/AgentReputationABI.js";

const publicClient = createPublicClient({ transport: http(RPC_URL), chain: baseSepolia });

export { publicClient };

type AgentCard = {
  name?: string;
  endpoint?: string;
  walletAddress?: string;
  pricing?: Record<string, number>;
  capabilities?: string[];
  x402?: {
    routes?: Array<{ method: string; path: string; price?: string }>;
  };
};

function normalizeTag(input: string): string {
  return LEGACY_CAPABILITY_ALIASES[input]?.tag ?? input;
}

export async function getAgentsForTag(tag: string): Promise<Address[]> {
  let agents = (await publicClient.readContract({
    address: IDENTITY_REGISTRY,
    abi: IDENTITY_ABI,
    functionName: "getAgentsByCapability",
    args: [tag],
  })) as Address[];

  if (!agents || agents.length === 0) {
    const [discovered] = (await publicClient.readContract({
      address: IDENTITY_REGISTRY,
      abi: IDENTITY_ABI,
      functionName: "discoverAgents",
      args: [[tag], 0n, 10n],
    })) as [Address[], bigint];
    agents = discovered || [];
  }
  return agents ?? [];
}

export async function getReputation(addr: Address): Promise<{ score: number; totalRatings: number }> {
  try {
    const [score, totalRatings] = (await publicClient.readContract({
      address: REPUTATION_REGISTRY,
      abi: REPUTATION_ABI,
      functionName: "getReputationScore",
      args: [addr],
    })) as [bigint, bigint];
    return { score: Number(score) / 100, totalRatings: Number(totalRatings) };
  } catch {
    return { score: 0, totalRatings: 0 };
  }
}

export async function resolveAgentCard(cid: string): Promise<AgentCard | null> {
  try {
    const res = await fetch(ipfsGatewayUrl(cid), { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    return (await res.json()) as AgentCard;
  } catch {
    return null;
  }
}

export async function listRegisteredCapabilities(): Promise<string[]> {
  const tags = [
    "csv-analysis",
    "file-storage",
    "statistics",
    "data-transformation",
    "ipfs",
    "decentralized-storage",
    "marine-dataset",
  ];
  const found: string[] = [];
  for (const tag of tags) {
    const agents = await getAgentsForTag(tag);
    if (agents.length > 0) found.push(tag);
  }
  return found;
}

export async function discoverBestAgent(
  capability: string,
  routePath?: string,
) {
  const alias = LEGACY_CAPABILITY_ALIASES[capability];
  const tag = normalizeTag(capability);
  const agents = await getAgentsForTag(tag);

  if (!agents || agents.length === 0) {
    return { found: false, error: `No agents registered for capability: ${tag}` };
  }

  const withRep = await Promise.all(
    agents.map(async (addr) => ({ addr, ...(await getReputation(addr)) })),
  );
  const best = withRep.sort((a, b) => b.score - a.score)[0]!;

  const cardCID = (await publicClient.readContract({
    address: IDENTITY_REGISTRY,
    abi: IDENTITY_ABI,
    functionName: "getAgentCard",
    args: [best.addr],
  })) as string;

  const card = await resolveAgentCard(cardCID);
  const suffix = routePath ?? alias?.routePath ?? "/analyze";
  const pricingKey = alias?.pricingKey ?? "baseRate";

  if (card) {
    const baseUrl = (card.endpoint ?? "").replace(/\/(upload|analyze|retrieve)$/, "");
    const routes = card.x402?.routes ?? [];
    const matched = routes.find((r) => r.path === suffix) ?? routes[0];
    const endpoint = `${baseUrl}${matched?.path ?? suffix}`;
    const price =
      card.pricing?.[pricingKey] ??
      (matched?.price ? parseFloat(matched.price.replace("$", "")) : 0.01);

    return {
      found: true,
      agentAddress: best.addr,
      serviceName: card.name ?? "Service Provider",
      endpoint,
      price,
      payTo: card.walletAddress ?? best.addr,
      reputation: { score: best.score, totalRatings: best.totalRatings },
      capability: tag,
      routes,
      cardCID,
    };
  }

  const fallbackBase =
    capability === "analyze" || tag === "csv-analysis"
      ? "https://rachax402-analyzer-service.up.railway.app"
      : "https://rachax402-storacha-service.up.railway.app";

  return {
    found: true,
    agentAddress: best.addr,
    serviceName: "Service Provider (card unavailable)",
    endpoint: `${fallbackBase}${suffix}`,
    price: pricingKey === "upload" ? 0.1 : pricingKey === "retrieve" ? 0.005 : 0.01,
    payTo: best.addr,
    reputation: { score: best.score, totalRatings: best.totalRatings },
    capability: tag,
    routes: [],
    cardCID,
  };
}
