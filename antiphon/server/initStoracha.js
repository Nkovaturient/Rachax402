import * as Client from "@storacha/client";
import { StoreMemory } from "@storacha/client/stores/memory";
import * as Proof from "@storacha/client/proof";
import { Signer } from "@storacha/client/principal/ed25519";

function getEnv(name, altName) {
  const v = process.env[name] ?? process.env[altName];
  if (typeof v !== "string" || !v.trim()) return null;
  return v.trim();
}

export async function initStorachaClient() {
  try {
    const pvtKey = getEnv("STORACHA_PRIVATE_KEY", "STORACHA_PVT_KEY");
    if (!pvtKey) {
      throw new Error("STORACHA_PRIVATE_KEY or STORACHA_PVT_KEY must be a non-empty string");
    }
    const principal = Signer.parse(pvtKey);
    const store = new StoreMemory();
    const client = await Client.create({ principal, store });

    const delegationKey = getEnv("STORACHA_DELEGATION_KEY");
    if (!delegationKey) {
      throw new Error("STORACHA_DELEGATION_KEY must be a non-empty string");
    }
    const proof = await Proof.parse(delegationKey);
    const space = await client.addSpace(proof);
    await client.setCurrentSpace(space.did());

    return client;
  } catch (error) {
    console.error("Error initializing Storacha client:", error);
    throw new Error("Failed to initialize Storacha client: " + error.message);
  }
}

/**
 * Upload a file to Storacha
 * @param {Client} client - Authenticated Storacha client
 * @param {File} file - File to upload
 * @returns {Promise<Object>} Upload result with CID and metadata
 */
export async function uploadFileToStoracha(file) {
  try {
    const client = await initStorachaClient()

    const cid = await client.uploadFile(file);
    if (!cid) {
      throw new Error("Failed to upload file, no CID returned");
    }

    const data = {
      cid: cid.toString(),
      filename: file.name,
      size: file.size,
      type: file.type,
      url: `https://w3s.link/ipfs/${cid}`,
      uploadedAt: new Date().toISOString(),
    };
    console.log("✅Uploaded successfully! File metadata:", data);
    return data;
  } catch (error) {
    console.error("Error uploading file to Storacha:", error);
    throw new Error("Failed to upload file: " + error.message);
  }
}


const GATEWAY_BASE = "https://w3s.link/ipfs";

export async function retrieveFileFromStoracha(cid) {
  const url = `${GATEWAY_BASE}/${cid}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Gateway returned ${res.status} for CID ${cid}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  const contentType = res.headers.get("content-type") || "application/octet-stream";
  console.log("✅Retrieved successfully! CID:", cid, "size:", buffer.length);
  return {
    cid,
    name: cid,
    size: buffer.length,
    type: contentType,
    data: buffer,
  };
}