/**
 * Pinata IPFS client — JWT and/or API key+secret + gateway retrieval.
 * Env: PINATA_JWT and/or PINATA_API_KEY+PINATA_API_SECRET, PINATA_GATEWAY
 */

function getEnv(name, altName) {
  const v = process.env[name] ?? process.env[altName];
  if (typeof v !== "string" || !v.trim()) return null;
  return v.trim();
}

export function getPinataGatewayBase() {
  const raw = getEnv("PINATA_GATEWAY") || "gateway.pinata.cloud";
  const host = raw.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return `https://${host}`;
}

export function ipfsGatewayUrl(cid) {
  return `${getPinataGatewayBase()}/ipfs/${cid}`;
}

/** Prefer API key+secret (full scopes); fall back to JWT. */
function pinataAuthHeaders() {
  const key = getEnv("PINATA_API_KEY");
  const secret = getEnv("PINATA_API_SECRET") || getEnv("PINATA_SECRET_API_KEY");
  if (key && secret) {
    return {
      pinata_api_key: key,
      pinata_secret_api_key: secret,
    };
  }
  const jwt = getEnv("PINATA_JWT");
  if (jwt) {
    return { Authorization: `Bearer ${jwt}` };
  }
  throw new Error(
    "Set PINATA_API_KEY+PINATA_API_SECRET (or PINATA_JWT with pin scopes)",
  );
}

/**
 * Upload a file to Pinata IPFS.
 * @param {File|{ name: string; size: number; type?: string; buffer: Buffer }} file
 */
export async function uploadFileToPinata(file) {
  const name = file.name || "upload";
  const type = file.type || "application/octet-stream";
  const buffer = file.buffer ?? Buffer.from(await file.arrayBuffer());

  const form = new FormData();
  form.append("file", new Blob([buffer], { type }), name);
  form.append(
    "pinataMetadata",
    JSON.stringify({ name }),
  );
  form.append(
    "pinataOptions",
    JSON.stringify({ cidVersion: 1 }),
  );

  const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: pinataAuthHeaders(),
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Pinata upload failed (${res.status}): ${text}`);
  }

  const json = await res.json();
  const cid = json.IpfsHash;
  if (!cid) {
    throw new Error("Pinata upload succeeded but no IpfsHash returned");
  }

  const data = {
    cid,
    filename: name,
    size: buffer.length,
    type,
    url: ipfsGatewayUrl(cid),
    uploadedAt: new Date().toISOString(),
  };
  console.log("✅ Pinata upload:", data.cid, data.filename);
  return data;
}

/**
 * Pin JSON agent card to Pinata (used by register-services.js).
 */
export async function pinJsonToPinata(payload, name = "agent-card.json") {
  const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
    method: "POST",
    headers: {
      ...pinataAuthHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      pinataContent: payload,
      pinataMetadata: { name },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Pinata JSON pin failed (${res.status}): ${text}`);
  }

  const json = await res.json();
  const cid = json.IpfsHash;
  if (!cid) {
    throw new Error("Pinata JSON pin succeeded but no IpfsHash returned");
  }
  return { cid, url: ipfsGatewayUrl(cid) };
}

export async function retrieveFileFromPinata(cid) {
  const url = ipfsGatewayUrl(cid);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Gateway returned ${res.status} for CID ${cid}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  const contentType = res.headers.get("content-type") || "application/octet-stream";
  console.log("✅ Pinata retrieve:", cid, "size:", buffer.length);
  return {
    cid,
    name: cid,
    size: buffer.length,
    type: contentType,
    data: buffer,
  };
}
