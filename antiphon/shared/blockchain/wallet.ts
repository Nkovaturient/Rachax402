import {
  createPublicClient,
  createWalletClient,
  http,
  type Address,
  type Hex,
  type PublicClient,
  type WalletClient,
} from "viem";
import { privateKeyToAccount, type PrivateKeyAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { getRpcUrl } from "./config.js";

const RPC_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 2;

function transportWithRetry(rpcUrl: string) {
  return http(rpcUrl, { timeout: RPC_TIMEOUT_MS, retryCount: MAX_RETRIES });
}

export class WalletService {
  constructor(private rpcUrl: string = getRpcUrl()) {}

  createWalletClient(privateKey: string): WalletClient {
    const account = privateKeyToAccount(privateKey as Hex);
    return createWalletClient({
      chain: baseSepolia,
      transport: transportWithRetry(this.rpcUrl),
      account,
    });
  }

  createPublicClient(): PublicClient {
    return createPublicClient({
      chain: baseSepolia,
      transport: transportWithRetry(this.rpcUrl),
    }) as PublicClient;
  }

  async getBalance(address: string): Promise<bigint> {
    const client = this.createPublicClient();
    try {
      return await client.getBalance({ address: address as Address });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`getBalance failed: ${msg}`);
    }
  }

  async signMessage(privateKey: string, message: string): Promise<Hex> {
    const account = privateKeyToAccount(privateKey as Hex);
    return account.signMessage({ message });
  }

  getAccount(privateKey: string): PrivateKeyAccount {
    return privateKeyToAccount(privateKey as Hex);
  }
}
