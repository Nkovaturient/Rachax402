/**
 * pinataProvider.ts — Pinata JWT staging + paid x402 IPFS tools for AgentA.
 */

import { tool } from "ai";
import { z } from "zod";
import { x402Client, wrapFetchWithPayment } from "@x402/fetch";
import { toClientEvmSigner } from "@x402/evm";
import { registerExactEvmScheme } from "@x402/evm/exact/client";
import type { WalletProvider } from "@coinbase/agentkit";
import { EvmWalletProvider } from "@coinbase/agentkit";
import { getPendingFile } from "../file-context";
import { ipfsGatewayUrl } from "@/lib/ipfs-gateway";
import type { TurnWorkflowState } from "../workflow-state";
import { PAID_X402_TOOLS } from "../workflow-state";

const X402_RETRY_DELAY_MS = 1500;

async function pinFileToIpfs(
  buffer: Buffer,
  filename: string,
  mimeType: string,
): Promise<{ cid: string; url: string }> {
  const jwt = process.env.PINATA_JWT;
  if (!jwt) {
    throw new Error("PINATA_JWT required for free CSV staging");
  }

  const bytes = new Uint8Array(buffer);
  const form = new FormData();
  form.append("file", new Blob([bytes], { type: mimeType }), filename);
  form.append("pinataMetadata", JSON.stringify({ name: filename }));
  form.append("pinataOptions", JSON.stringify({ cidVersion: 1 }));

  const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: { Authorization: `Bearer ${jwt}` },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Pinata upload failed (${res.status}): ${text}`);
  }

  const json = (await res.json()) as { IpfsHash?: string };
  const cid = json.IpfsHash;
  if (!cid) throw new Error("Pinata upload succeeded but no IpfsHash returned");
  return { cid, url: ipfsGatewayUrl(cid) };
}

function createX402Fetch(walletProvider: WalletProvider) {
  if (!(walletProvider instanceof EvmWalletProvider)) {
    throw new Error("paidStoreFile/paidRetrieveFile require EvmWalletProvider (CDP Smart Wallet)");
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

async function fetchWithPaymentRetry(
  fetchWithPayment: ReturnType<typeof wrapFetchWithPayment>,
  url: string,
  init: RequestInit,
  retryInit?: () => RequestInit,
): Promise<Response> {
  const res = await fetchWithPayment(url, init);
  if (res.status === 402) {
    await new Promise((r) => setTimeout(r, X402_RETRY_DELAY_MS));
    return fetchWithPayment(url, retryInit ? retryInit() : init);
  }
  return res;
}

function markPaidSuccess(workflow?: TurnWorkflowState) {
  if (workflow) workflow.agenta.paidTaskSucceeded = true;
}

export function getPinataTools(
  walletProvider: WalletProvider,
  options?: { conversationId?: string; workflow?: TurnWorkflowState },
) {
  const conversationId = options?.conversationId;
  const workflow = options?.workflow;

  return {
    stageCsvForAnalysis: tool({
      description: `Upload the user's attached CSV file to IPFS (Pinata) for FREE to get an inputCID.
Required BEFORE calling the DataAnalyzer — the analyzer needs a CID, not raw bytes.
The file bytes are pre-loaded server-side; just pass the filename from the [File attached: "..."] annotation.
FREE — uses platform Pinata JWT, no x402 payment.`,
      inputSchema: z.object({
        filename: z.string().describe('Filename from the [File attached: "..."] annotation'),
      }),
      execute: async ({ filename }): Promise<string> => {
        try {
          const pending = getPendingFile(conversationId);
          if (!pending) {
            return "No file attached. Ask the user to upload a CSV file.";
          }

          const buffer = Buffer.from(pending.base64, "base64");
          console.log(`[Pinata] Staging CSV: ${filename} (${buffer.length} bytes)`);
          const { cid, url } = await pinFileToIpfs(buffer, filename, "text/csv");
          console.log(`[Pinata] ✅ Staged — CID: ${cid}`);

          return JSON.stringify({
            inputCID: cid,
            filename,
            sizeBytes: buffer.length,
            ipfsUrl: url,
            logLine: `✅ CSV staged — inputCID: ${cid.slice(0, 20)}...`,
          });
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          return `Pinata staging failed: ${message}`;
        }
      },
    }),

    uploadToIpfs: tool({
      description: `Upload the user's attached file to IPFS for FREE using platform Pinata credentials.
For intermediate/temporary data transport only.
For permanent paid storage via AgentB, use paidStoreFile instead.`,
      inputSchema: z.object({
        filename: z.string().describe("Filename from the [File attached: \"...\"] annotation"),
      }),
      execute: async ({ filename }): Promise<string> => {
        try {
          const pending = getPendingFile(conversationId);
          if (!pending) {
            return "No file attached. Ask the user to upload a file.";
          }
          const buffer = Buffer.from(pending.base64, "base64");
          const { cid, url } = await pinFileToIpfs(buffer, filename, pending.mimeType);
          return JSON.stringify({ cid, filename, ipfsUrl: url });
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          return `Upload failed: ${message}`;
        }
      },
    }),

    paidStoreFile: tool({
      description: `Pay AgentB IPFS storage $0.1 USDC via x402 and upload a file.
ALWAYS call discoverService first to get the endpoint.
Use this — NOT X402ActionProvider — for file uploads (multipart/form-data).`,
      inputSchema: z.object({
        filename: z.string(),
        endpoint: z.string().describe("/upload endpoint URL from discoverService"),
      }),
      execute: async ({ filename, endpoint }): Promise<string> => {
        try {
          const pending = getPendingFile(conversationId);
          if (!pending) {
            return "No file attached. Ask the user to upload a file.";
          }
          const buffer = Buffer.from(pending.base64, "base64");
          const formData = new FormData();
          formData.append("file", new File([buffer], filename, { type: pending.mimeType }));

          const fetchWithPayment = createX402Fetch(walletProvider);
          const res = await fetchWithPaymentRetry(
            fetchWithPayment,
            endpoint,
            { method: "POST", body: formData },
            () => {
              const retryForm = new FormData();
              retryForm.append(
                "file",
                new File([buffer], filename, { type: pending.mimeType }),
              );
              return { method: "POST", body: retryForm };
            },
          );

          if (!res.ok) {
            const text = await res.text().catch(() => `HTTP ${res.status}`);
            return `Upload failed (${res.status}): ${text}`;
          }

          const result = await res.json();
          const cid = result?.data?.cid ?? result?.cid ?? "unknown";
          markPaidSuccess(workflow);

          return JSON.stringify({
            success: true,
            cid,
            filename,
            sizeBytes: buffer.length,
            ipfsUrl: ipfsGatewayUrl(cid),
            logLine: `✅ Payment confirmed, file stored — CID: ${String(cid).slice(0, 20)}...`,
          });
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          return `paidStoreFile failed: ${message}`;
        }
      },
    }),

    paidRetrieveFile: tool({
      description: `Pay AgentB IPFS storage $0.005 USDC via x402 and retrieve a file by CID.
ALWAYS call discoverService first. Returns gateway URL and truncated base64.`,
      inputSchema: z.object({
        cid: z.string(),
        endpoint: z.string().describe("/retrieve endpoint URL from discoverService"),
      }),
      execute: async ({ cid, endpoint }): Promise<string> => {
        try {
          const url = `${endpoint}?cid=${encodeURIComponent(cid)}`;
          const fetchWithPayment = createX402Fetch(walletProvider);
          const res = await fetchWithPaymentRetry(fetchWithPayment, url, { method: "GET" });

          if (!res.ok) {
            const text = await res.text().catch(() => `HTTP ${res.status}`);
            return `Retrieve failed (${res.status}): ${text}`;
          }

          const contentType = res.headers.get("content-type") || "application/octet-stream";
          const returnedCid = res.headers.get("X-CID") || cid;
          const arrayBuffer = await res.arrayBuffer();
          const base64 = Buffer.from(arrayBuffer).toString("base64");
          markPaidSuccess(workflow);

          return JSON.stringify({
            success: true,
            cid: returnedCid,
            contentType,
            sizeBytes: arrayBuffer.byteLength,
            base64Content: base64.slice(0, 100) + "...[truncated]",
            ipfsUrl: ipfsGatewayUrl(returnedCid),
            logLine: `✅ File retrieved — ${ipfsGatewayUrl(returnedCid)}`,
          });
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          return `paidRetrieveFile failed: ${message}`;
        }
      },
    }),
  };
}

export { PAID_X402_TOOLS };
