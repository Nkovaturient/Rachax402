import { elizaLogger } from "@elizaos/core";
import type { ActionHandlerCallback, ActionHandlerState } from "../../index.js";
import axios from "axios";
import { WalletService } from "../../shared/blockchain/index.js";

export interface X402Config {
  facilitatorUrl: string;
  privateKey: string;
  rpcUrl: string;
  payToAddress?: string | undefined;
}

export function getX402Actions(config: X402Config | null) {
  const walletService = config ? new WalletService(config.rpcUrl) : null;

  return {
    PAYMENT_REQUEST: {
      name: 'PAYMENT_REQUEST',
      description: 'Handle x402 payment challenges: parse 402 responses, sign payment authorizations, submit signed payloads',
      similes: ['pay', 'payment', 'authorize'],
      validate: async () => true,
      handler: async (
        _runtime: unknown,
        _message: unknown,
        state: ActionHandlerState,
        _options: unknown,
        callback: ActionHandlerCallback
      ) => {
        if (!config || !walletService) {
          await callback?.({ text: "x402 not configured. Set X402_FACILITATOR_URL and PRIVATE_KEY." });
          return;
        }

        const providerEndpoint = state.data?.providerEndpoint as string;
        const inputCID = state.data?.inputCID as string;

        if (!providerEndpoint || !inputCID) {
          await callback?.({ text: "Missing provider endpoint or input CID." });
          return;
        }

        try {
          await callback?.({ text: `Sending task request to ${providerEndpoint}...` });

          const taskRequest = {
            action: "analyze",
            inputCID,
            requirements: "statistical summary and trend analysis"
          };

          const response = await axios.post(providerEndpoint, taskRequest, {
            validateStatus: (status) => status === 200 || status === 402
          });

          if (response.status === 402) {
            await callback?.({
              text: `Payment required: ${response.headers['x-402-price'] || '0.01 USDC'}. Processing payment...`
            });

            const paymentPayload = {
              amount: response.headers['x-402-price'] || "0.01",
              currency: response.headers['x-402-currency'] || "USDC",
              network: response.headers['x-402-network'] || "base-sepolia",
              payTo: response.headers['x-402-pay-to'] || config.payToAddress,
            };

            await callback?.({ text: `Signing payment authorization for ${paymentPayload.amount} ${paymentPayload.currency}...` });

            const signedPayment = await signX402Payment(paymentPayload, config.privateKey, config.facilitatorUrl, config.rpcUrl);

            await callback?.({ text: `Payment signed. Retrying request with payment header...` });

            const paidResponse = await axios.post(providerEndpoint, taskRequest, {
              headers: {
                'x-402-payment': signedPayment
              }
            });

            if (paidResponse.status === 200) {
              const resultCID = paidResponse.data.resultCID;
              await callback?.({
                text: `Payment verified! Task completed. Result CID: ${resultCID}`
              });
              state.data = { ...state.data, resultCID };
            } else {
              await callback?.({ text: `Payment verification failed. Status: ${paidResponse.status}` });
            }
          } else {
            await callback?.({ text: `Task completed without payment. Result CID: ${response.data.resultCID}` });
            state.data = { ...state.data, resultCID: response.data.resultCID };
          }
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : String(error);
          elizaLogger.error("x402 payment request error:", error);
          await callback?.({ text: `Payment request failed: ${msg}` });
        }
      },
    },

    PAYMENT_VERIFY: {
      name: 'PAYMENT_VERIFY',
      description: 'Verify x402 payment via Coinbase facilitator, confirm USDC settlement before processing',
      similes: ['verify', 'check payment'],
      validate: async () => true,
      handler: async (
        _runtime: unknown,
        _message: unknown,
        _state: unknown,
        _options: unknown,
        callback: ActionHandlerCallback
      ) => {
        if (!config) {
          await callback?.({ text: "x402 not configured." });
          return;
        }

        await callback?.({ text: "Verifying payment via Coinbase facilitator..." });

        try {
          const verificationResult = await verifyX402Payment(config.facilitatorUrl);

          if (verificationResult.verified) {
            await callback?.({
              text: `Payment verified: ${verificationResult.amount} ${verificationResult.currency} settled on ${verificationResult.network}.`
            });
          } else {
            await callback?.({ text: "Payment verification failed." });
          }
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : String(error);
          elizaLogger.error("x402 payment verify error:", error);
          await callback?.({ text: `Payment verification error: ${msg}` });
        }
      },
    },
  };
}

async function signX402Payment(
  payload: { amount: string; currency: string; network: string; payTo?: string },
  privateKey: string,
  facilitatorUrl: string,
  rpcUrl: string
): Promise<string> {
  const walletService = new WalletService(rpcUrl);
  const wallet = walletService.createWalletClient(privateKey);

  const { createPaymentPayload, signPaymentPayload } = await import("@x402/core");

  const paymentPayload = await createPaymentPayload({
    amount: payload.amount,
    currency: payload.currency,
    network: payload.network || "eip155:84532",
    payTo: payload.payTo || "",
    facilitatorUrl,
  });

  const signed = await signPaymentPayload(paymentPayload, wallet);
  return JSON.stringify(signed);
}

async function verifyX402Payment(facilitatorUrl: string): Promise<{
  verified: boolean;
  amount?: string;
  currency?: string;
  network?: string;
}> {
  try {
    const response = await axios.get(`${facilitatorUrl}/verify`, {
      timeout: 10000
    });
    return {
      verified: response.data.verified || false,
      amount: response.data.amount,
      currency: response.data.currency,
      network: response.data.network,
    };
  } catch {
    return { verified: false };
  }
}
