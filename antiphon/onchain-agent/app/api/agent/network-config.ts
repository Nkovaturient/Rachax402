/**
 * CDP AgentKit + Rachax402 network alignment.
 *
 * Set NETWORK_ID to `base-sepolia` or `base-mainnet` (Coinbase CDP smart wallet).
 * Optional: RPC_URL (AgentKit / viem reads) or BASE_RPC_URL (ERC-8004 reads); defaults below.
 *
 * Match AgentB servers: same chain as X402_NETWORK (eip155:84532 vs eip155:8453) when using CDP facilitator.
 */

import type { Address, Chain } from "viem";
import { base, baseSepolia } from "viem/chains";

export const CDP_NETWORK_BASE_SEPOLIA = "base-sepolia";
export const CDP_NETWORK_BASE_MAINNET = "base-mainnet";

/** USDC on Base (Circle) — same token AgentKit x402 + Permit2 use */
export const USDC_BASE_SEPOLIA: Address =
  "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
export const USDC_BASE_MAINNET: Address =
  "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

export const PERMIT2_ADDRESS: Address =
  "0x000000000022D473030F116dDEE9F6B43aC78BA3";

export function normalizeCdpNetworkId(fromEnv = process.env.NETWORK_ID): string {
  return (fromEnv || CDP_NETWORK_BASE_SEPOLIA).toLowerCase();
}

export function isCdpBaseMainnet(networkId: string): boolean {
  const n = networkId.toLowerCase();
  return n === CDP_NETWORK_BASE_MAINNET || n === "base";
}

export function isCdpBaseSepolia(networkId: string): boolean {
  return !isCdpBaseMainnet(networkId);
}

export function viemChainForCdpNetwork(networkId: string): Chain {
  return isCdpBaseMainnet(networkId) ? base : baseSepolia;
}

export function defaultPublicRpc(networkId: string): string {
  return isCdpBaseMainnet(networkId)
    ? "https://mainnet.base.org"
    : "https://sepolia.base.org";
}

/** Prefer AgentKit RPC, then ERC-8004 var, then chain default */
export function rpcUrlForViem(networkId: string): string {
  return (
    process.env.RPC_URL ||
    process.env.BASE_RPC_URL ||
    defaultPublicRpc(networkId)
  );
}

export function usdcAddressForCdpNetwork(networkId: string): Address {
  return isCdpBaseMainnet(networkId)
    ? USDC_BASE_MAINNET
    : USDC_BASE_SEPOLIA;
}

export function blockExplorerOrigin(networkId: string): string {
  return isCdpBaseMainnet(networkId)
    ? "https://basescan.org"
    : "https://sepolia.basescan.org";
}

export function caip2ForCdpNetwork(networkId: string): string {
  return isCdpBaseMainnet(networkId) ? "eip155:8453" : "eip155:84532";
}
