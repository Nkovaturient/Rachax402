/** Pinata / IPFS gateway URL helpers (client + server). */

export function getIpfsGatewayBase(): string {
  const raw = process.env.PINATA_GATEWAY || "gateway.pinata.cloud";
  const host = raw.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return `https://${host}`;
}

export function ipfsGatewayUrl(cid: string): string {
  return `${getIpfsGatewayBase()}/ipfs/${cid}`;
}
