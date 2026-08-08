/**
 * SDG → AgentA on-chain delegation: discover, pay, invoke x402 services.
 */

import { prepareAgentkitAndWalletProvider } from "@/app/api/agent/prepare-agentkit";
import { normalizeCdpNetworkId } from "@/app/api/agent/network-config";
import {
  discoverOnChainService,
  verifyServiceHealth,
} from "@/lib/agent/erc8004-discovery";
import { invokeX402JsonRoute } from "@/lib/agent/x402-invoke";

export type OnchainDelegateRequest = {
  intent: string;
  capabilityHint?: string;
  budgetUsdc?: number;
  routePath?: string;
  jsonBody?: Record<string, unknown>;
};

export type OnchainDelegateResult = {
  ok: boolean;
  intent: string;
  capability?: string;
  endpoint?: string;
  price?: string;
  response?: unknown;
  error?: string;
  agentAddress?: string;
};

const DEFAULT_BUDGET = 0.1;
const BUDGET_THRESHOLD = 0.05;

export async function delegateOnchainService(
  req: OnchainDelegateRequest,
): Promise<OnchainDelegateResult> {
  const capability = req.capabilityHint ?? inferCapability(req.intent);
  const budget = req.budgetUsdc ?? DEFAULT_BUDGET;

  if (budget > BUDGET_THRESHOLD) {
    return {
      ok: false,
      intent: req.intent,
      error: `Budget $${budget} exceeds auto-approval threshold ($${BUDGET_THRESHOLD}). Ask user to confirm spend.`,
    };
  }

  try {
    const { walletProvider } = await prepareAgentkitAndWalletProvider();
    const networkId = normalizeCdpNetworkId(walletProvider.getNetwork().networkId);

    const discovered = await discoverOnChainService(
      capability,
      networkId,
      req.routePath,
    );

    if (!discovered.found) {
      return {
        ok: false,
        intent: req.intent,
        capability,
        error: discovered.error,
      };
    }

    const endpoint = discovered.endpoint;
    const price = `$${discovered.price} USDC`;
    if (discovered.price > budget) {
      return {
        ok: false,
        intent: req.intent,
        capability,
        endpoint,
        price,
        error: `Service price ${price} exceeds budget $${budget}`,
      };
    }

    const health = await verifyServiceHealth(endpoint);
    if (!health.healthy) {
      return {
        ok: false,
        intent: req.intent,
        capability,
        endpoint,
        error: health.error ?? "Service health check failed",
      };
    }

    const routePath = req.routePath ?? discovered.routePath ?? inferRoutePath(capability);
    if (routePath === "/upload" || routePath === "/retrieve") {
      return {
        ok: false,
        intent: req.intent,
        error: "Binary upload/retrieve delegation requires AgentA arena with attached file",
      };
    }

    const invoked = await invokeX402JsonRoute(
      walletProvider,
      endpoint,
      "POST",
      req.jsonBody ?? { requirements: req.intent },
    );

    if (!invoked.ok) {
      return {
        ok: false,
        intent: req.intent,
        capability,
        endpoint,
        price,
        error: invoked.error,
      };
    }

    return {
      ok: true,
      intent: req.intent,
      capability: discovered.capability,
      endpoint,
      price,
      agentAddress: discovered.agentAddress,
      response: invoked.data,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, intent: req.intent, error: message };
  }
}

function inferCapability(intent: string): string {
  const lower = intent.toLowerCase();
  if (lower.includes("csv") || lower.includes("analy")) return "csv-analysis";
  if (lower.includes("store") || lower.includes("upload")) return "file-storage";
  if (lower.includes("marine") || lower.includes("ocean")) return "marine-dataset";
  return "csv-analysis";
}

function inferRoutePath(capability: string): string {
  if (capability === "file-storage") return "/upload";
  if (capability.includes("retrieve")) return "/retrieve";
  return "/analyze";
}
