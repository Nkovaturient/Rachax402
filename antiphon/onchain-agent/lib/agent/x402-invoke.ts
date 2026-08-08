/**
 * Shared x402 JSON route invocation for AgentA + SDG delegate.
 */

import { x402Client, wrapFetchWithPayment } from "@x402/fetch";
import { toClientEvmSigner } from "@x402/evm";
import { registerExactEvmScheme } from "@x402/evm/exact/client";
import type { WalletProvider } from "@coinbase/agentkit";
import { EvmWalletProvider } from "@coinbase/agentkit";

function createX402Fetch(walletProvider: WalletProvider) {
  if (!(walletProvider instanceof EvmWalletProvider)) {
    throw new Error("x402 invoke requires EvmWalletProvider");
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

export async function invokeX402JsonRoute(
  walletProvider: WalletProvider,
  endpoint: string,
  method: "GET" | "POST",
  body?: Record<string, unknown>,
): Promise<{ ok: boolean; data?: unknown; error?: string }> {
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
      return { ok: false, error: `x402 request failed (${res.status}): ${text}` };
    }
    const text = await res.text();
    try {
      return { ok: true, data: JSON.parse(text) };
    } catch {
      return { ok: true, data: text.slice(0, 2000) };
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}
