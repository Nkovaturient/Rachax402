import { elizaLogger } from "@elizaos/core";
import type { ActionHandlerCallback, ActionHandlerState } from "../../index.js";
import { privateKeyToAccount } from "viem/accounts";
import { createPublicClient, http, type Hex } from "viem";
import { baseSepolia } from "viem/chains";
import { wrapFetchWithPayment, x402Client } from "@x402/fetch";
import { registerExactEvmScheme } from "@x402/evm/exact/client";
import { toClientEvmSigner } from "@x402/evm";

export interface X402Config {
  facilitatorUrl: string;
  privateKey: string;
  rpcUrl: string;
}

function createPaidFetch(privateKey: Hex, rpcUrl: string) {
  const account = privateKeyToAccount(privateKey);
  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(rpcUrl),
  });
  const signer = toClientEvmSigner(account, publicClient);
  const client = new x402Client();
  registerExactEvmScheme(client, { signer });
  return wrapFetchWithPayment(fetch, client);
}

export function getX402Actions(config: X402Config | null) {
  return {
    PAYMENT_REQUEST: {
      name: 'PAYMENT_REQUEST',
      description: 'Send task request to AgentB with x402 auto-payment (EIP-712)',
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
        const capability = (state.data?.capability as string) || 'csv-analysis';

        if (!providerEndpoint) {
          await callback?.({ text: "Missing provider endpoint. Run AGENT_DISCOVER first." });
          return;
        }

        try {
          const fetchWithPayment = createPaidFetch(config.privateKey as Hex, config.rpcUrl);

          await callback?.({ text: `Sending paid request to ${providerEndpoint}...` });

          let paidResponse: Response;

          if (capability === 'csv-analysis') {
            if (!inputCID) {
              await callback?.({ text: "Missing inputCID for analysis." });
              return;
            }
            paidResponse = await fetchWithPayment(providerEndpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                inputCID,
                requirements: (state.data?.requirements as string) || 'statistical summary and trend analysis',
              }),
            });
          } else if (capability === 'file-retrieval') {
            const cid = (state.data?.retrieveCID as string) || inputCID;
            if (!cid) {
              await callback?.({ text: "Missing CID for retrieval." });
              return;
            }
            paidResponse = await fetchWithPayment(`${providerEndpoint}?cid=${encodeURIComponent(cid)}`, {
              method: 'GET',
            });
          } else if (capability === 'file-storage') {
            const fileBuffer = state.data?.fileBuffer as ArrayBuffer | undefined;
            const fileName = (state.data?.fileName as string) || 'upload.bin';
            const fileMimeType = (state.data?.fileMimeType as string) || 'application/octet-stream';

            if (!fileBuffer) {
              await callback?.({ text: "Missing file data for upload." });
              return;
            }

            const formData = new FormData();
            const blob = new Blob([fileBuffer], { type: fileMimeType });
            formData.append('file', blob, fileName);

            paidResponse = await fetchWithPayment(providerEndpoint, {
              method: 'POST',
              body: formData,
            });
          } else {
            const cid = (state.data?.retrieveCID as string) || inputCID;
            if (!cid) {
              await callback?.({ text: "Missing CID for retrieval." });
              return;
            }
            paidResponse = await fetchWithPayment(`${providerEndpoint}?cid=${encodeURIComponent(cid)}`, {
              method: 'GET',
            });
          }

          if (!paidResponse.ok) {
            const errBody = await paidResponse.text().catch(() => '');
            throw new Error(`Request failed (${paidResponse.status}): ${errBody}`);
          }

          await callback?.({ text: "Payment verified. Processing response..." });

          if (capability === 'csv-analysis') {
            const result = await paidResponse.json();
            state.data = {
              ...state.data,
              resultCID: result.resultCID,
              analysisResults: {
                summary: result.summary,
                statistics: result.statistics,
                insights: result.insights,
                resultCID: result.resultCID,
              },
            };
            await callback?.({ text: `Analysis complete. Result CID: ${result.resultCID}` });
          } else if (capability === 'file-storage') {
            const result = await paidResponse.json();
            const cid = result.data?.cid || result.cid;
            state.data = {
              ...state.data,
              resultCID: cid,
              storageResults: {
                cid,
                fileName: result.data?.filename || state.data?.fileName,
                fileSize: result.data?.size || 0,
              },
            };
            await callback?.({ text: `File stored. CID: ${cid}` });
          } else {
            const contentType = paidResponse.headers.get('content-type') || 'application/octet-stream';
            const cidHeader = paidResponse.headers.get('x-cid') || '';
            const buffer = await paidResponse.arrayBuffer();
            state.data = {
              ...state.data,
              retrievedData: buffer,
              retrievedContentType: contentType,
              retrievedCID: cidHeader,
            };
            await callback?.({ text: `File retrieved (${buffer.byteLength} bytes).` });
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
        _state: ActionHandlerState,
        _options: unknown,
        callback: ActionHandlerCallback
      ) => {
        if (!config) {
          await callback?.({ text: "x402 not configured." });
          return;
        }
        await callback?.({ text: "Payment verification is handled automatically by wrapFetchWithPayment." });
      },
    },
  };
}
