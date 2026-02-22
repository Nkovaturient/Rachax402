import { x402Client, x402HTTPClient } from '@x402/core/client';
import { toClientEvmSigner } from '@x402/evm';
import { registerExactEvmScheme } from '@x402/evm/exact/client';

export type WalletSigner = {
  address: `0x${string}`;
  signTypedDataAsync: (opts: {
    domain: { name: string; version: string; chainId: number; verifyingContract: `0x${string}` };
    types: Record<string, { name: string; type: string }[]>;
    primaryType: string;
    message: Record<string, unknown>;
  }) => Promise<`0x${string}`>;
};

export type PublicClientLike = {
  readContract: (args: {
    address: `0x${string}`;
    abi: readonly unknown[];
    functionName: string;
    args?: readonly unknown[];
  }) => Promise<unknown>;
};

export function createX402Client(signer: WalletSigner, publicClient?: PublicClientLike) {
  const adapter = {
    address: signer.address,
    signTypedData: signer.signTypedDataAsync,
  };
  const evmSigner = toClientEvmSigner(adapter, publicClient);
  const client = new x402Client();
  registerExactEvmScheme(client, { signer: evmSigner });
  return new x402HTTPClient(client);
}

export function getPaymentRequiredFromResponse(response: Response): string | null {
  return response.headers.get('payment-required') || response.headers.get('PAYMENT-REQUIRED');
}

export function getTransactionHashFromResponse(response: Response): string | null {
  const header =
    response.headers.get('payment-response') || response.headers.get('PAYMENT-RESPONSE') ||
    response.headers.get('x-payment-response') || response.headers.get('X-PAYMENT-RESPONSE');
  if (!header) return null;
  try {
    const decoded = JSON.parse(atob(header));
    const tx = decoded?.transaction;
    return typeof tx === 'string' && tx.length > 0 ? tx : null;
  } catch {
    return null;
  }
}

export async function createPaymentHeaders(
  paymentRequiredHeader: string,
  signer: WalletSigner,
  publicClient?: PublicClientLike
): Promise<Record<string, string>> {
  const getHeader = (name: string) =>
    name.toLowerCase() === 'payment-required' ? paymentRequiredHeader : null;
  const httpClient = createX402Client(signer, publicClient);
  const paymentRequired = httpClient.getPaymentRequiredResponse(getHeader, null);
  const paymentPayload = await httpClient.createPaymentPayload(paymentRequired);
  return httpClient.encodePaymentSignatureHeader(paymentPayload);
}
