export const BASE_SEPOLIA_CHAIN_ID = 84532;

export function getRpcUrl(): string {
  return process.env.BASE_RPC_URL ?? "https://sepolia.base.org";
}
