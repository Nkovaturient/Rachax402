/**
 * Pinata JWT staging for MCP server (free CSV staging).
 */

function gatewayBase(): string {
  const raw = process.env.PINATA_GATEWAY || "gateway.pinata.cloud";
  const host = raw.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return `https://${host}`;
}

export function ipfsGatewayUrl(cid: string): string {
  return `${gatewayBase()}/ipfs/${cid}`;
}

export async function pinFileToPinata(
  buffer: Buffer,
  filename: string,
  mimeType: string,
): Promise<{ cid: string; url: string }> {
  const jwt = process.env.PINATA_JWT;
  if (!jwt) {
    throw new Error("PINATA_JWT required for Pinata operations");
  }

  const form = new FormData();
  form.append("file", new Blob([buffer], { type: mimeType }), filename);
  form.append("pinataMetadata", JSON.stringify({ name: filename }));

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
