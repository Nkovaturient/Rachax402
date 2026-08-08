import type { Address } from "viem";

export const IDENTITY_REGISTRY = (process.env.ERC8004_IDENTITY_REGISTRY ||
  "0x1352abA587fFbbC398d7ecAEA31e2948D3aFE4Fb") as Address;
export const REPUTATION_REGISTRY = (process.env.ERC8004_REPUTATION_REGISTRY ||
  "0x3FdD300147940a35F32AdF6De36b3358DA682B5c") as Address;
export const RPC_URL = process.env.BASE_RPC_URL || "https://sepolia.base.org";
export const X402_NETWORK = process.env.X402_NETWORK || "eip155:84532";

export const LEGACY_CAPABILITY_ALIASES: Record<
  string,
  { tag: string; routePath: string; pricingKey: string }
> = {
  analyze: { tag: "csv-analysis", routePath: "/analyze", pricingKey: "baseRate" },
  store: { tag: "file-storage", routePath: "/upload", pricingKey: "upload" },
  retrieve: { tag: "file-storage", routePath: "/retrieve", pricingKey: "retrieve" },
};

/** @deprecated use LEGACY_CAPABILITY_ALIASES */
export const CAPABILITY_MAP = LEGACY_CAPABILITY_ALIASES;
