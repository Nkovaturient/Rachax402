/**
 * ElizaOS Agent A (Requester)
 * Properly integrates with Agent B Express server
 */

import { elizaLogger } from "@elizaos/core";
import type { ActionHandlerCallback, ActionHandlerState } from "../../index.js";
import axios from "axios";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";

export interface X402Config {
  facilitatorUrl: string;
  privateKey: string;
  rpcUrl: string;
}

export function getX402Actions(config: X402Config | null) {
  return {
    PAYMENT_REQUEST: {
      name: 'PAYMENT_REQUEST',
      description: 'Send task request to Agent B, handle 402, sign payment, retry with proof',
      similes: ['pay', 'payment', 'request service'],
      validate: async () => true,
      handler: async (
        _runtime: unknown,
        _message: unknown,
        state: ActionHandlerState,
        _options: unknown,
        callback: ActionHandlerCallback
      ) => {
        if (!config) {
          await callback?.({ text: "x402 not configured." });
          return;
        }

        const providerEndpoint = state.data?.providerEndpoint as string;
        const inputCID = state.data?.inputCID as string;

        if (!providerEndpoint || !inputCID) {
          await callback?.({ text: "Missing provider endpoint or input CID. Use AGENT_DISCOVER first." });
          return;
        }

        try {
          await callback?.({ text: `Sending task request to ${providerEndpoint}...` });

          // Step 1: Initial request (will get 402)
          const taskRequest = {
            inputCID,
            requirements: "statistical summary and trend analysis"
          };

          const response = await axios.post(providerEndpoint, taskRequest, {
            validateStatus: (status) => status === 200 || status === 402,
            timeout: 15000
          });

          if (response.status === 402) {
            // Step 2: Parse payment requirements
            const paymentHeader = response.headers['payment-required'];
            if (!paymentHeader) {
              throw new Error("402 response missing PAYMENT-REQUIRED header");
            }

            const paymentReq = JSON.parse(
              Buffer.from(paymentHeader, 'base64').toString()
            );

            const accept = paymentReq.accepts[0];
            await callback?.({
              text: `Payment required: ${accept.price} on ${accept.network}. Signing payment...`
            });

            // Step 3: Sign payment with x402
            const account = privateKeyToAccount(config.privateKey as `0x${string}`);
            const walletClient = createWalletClient({
              chain: baseSepolia,
              transport: http(config.rpcUrl),
              account
            });

            // Create payment payload
            const paymentPayload = {
              price: accept.price,
              network: accept.network,
              payTo: accept.payTo,
              facilitator: config.facilitatorUrl,
              timestamp: Date.now()
            };

            // Sign the payment
            const payloadStr = JSON.stringify(paymentPayload);
            const signature = await walletClient.signMessage({
              message: payloadStr
            });

            const signedPayment = Buffer.from(
              JSON.stringify({
                payload: paymentPayload,
                signature
              })
            ).toString('base64');

            await callback?.({ text: "Payment signed. Retrying request..." });

            // Step 4: Retry with payment proof
            const paidResponse = await axios.post(providerEndpoint, taskRequest, {
              headers: {
                'X-PAYMENT': signedPayment,
                'PAYMENT-SIGNATURE': signedPayment // Alternative header name
              },
              timeout: 30000
            });

            if (paidResponse.status === 200) {
              const resultCID = paidResponse.data.resultCID;
              await callback?.({
                text: `✅ Payment verified! Analysis complete. Result CID: ${resultCID}`
              });
              
              state.data = { 
                ...state.data, 
                resultCID,
                rating: 5,
                comment: "Excellent analysis service"
              };
            } else {
              throw new Error(`Unexpected response status: ${paidResponse.status}`);
            }

          } else if (response.status === 200) {
            // No payment required (testing mode?)
            await callback?.({
              text: `Task completed without payment. Result CID: ${response.data.resultCID}`
            });
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
      description: 'Verify payment settlement via facilitator',
      similes: ['verify payment', 'check settlement'],
      validate: async () => true,
      handler: async (
        _runtime: unknown,
        _message: unknown,
        state: ActionHandlerState,
        _options: unknown,
        callback: ActionHandlerCallback
      ) => {
        if (!config) {
          await callback?.({ text: "x402 not configured." });
          return;
        }

        try {
          await callback?.({ text: "Verifying payment settlement..." });

          const txHash = state.data?.paymentTxHash as string;
          if (!txHash) {
            await callback?.({ text: "No payment transaction hash found." });
            return;
          }

          const response = await axios.get(
            `${config.facilitatorUrl}/verify/${txHash}`,
            { timeout: 10000 }
          );

          if (response.data.verified) {
            await callback?.({
              text: `✅ Payment verified: ${response.data.amount} ${response.data.currency} on ${response.data.network}`
            });
          } else {
            await callback?.({ text: "❌ Payment verification failed." });
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
