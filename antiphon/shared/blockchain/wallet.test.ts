import { describe, it } from "node:test";
import assert from "node:assert";
import { WalletService } from "./wallet.js";

describe("WalletService", () => {
  const rpcUrl = process.env.BASE_RPC_URL || "https://sepolia.base.org";

  it("createPublicClient returns a client", () => {
    const service = new WalletService(rpcUrl);
    const client = service.createPublicClient();
    assert.ok(client);
    assert.strictEqual(typeof client.getBalance, "function");
  });

  it("createWalletClient returns a client when given a private key", () => {
    const key = process.env.AGENT_A_PRIVATE_KEY || process.env.PRIVATE_KEY;
    if (!key) {
      console.log("Skip: no AGENT_A_PRIVATE_KEY or PRIVATE_KEY");
      return;
    }
    const service = new WalletService(rpcUrl);
    const client = service.createWalletClient(key);
    assert.ok(client);
    assert.ok(client.account);
  });

  it("getBalance returns bigint for valid address on Base Sepolia", { timeout: 10_000 }, async () => {
    const service = new WalletService(rpcUrl);
    const addr = "0x0000000000000000000000000000000000000001" as const;
    const balance = await service.getBalance(addr);
    assert.ok(typeof balance === "bigint");
    assert.ok(balance >= 0n);
  });

  it("signMessage returns hex string when given private key", async () => {
    const key = process.env.AGENT_A_PRIVATE_KEY || process.env.PRIVATE_KEY;
    if (!key) {
      console.log("Skip: no AGENT_A_PRIVATE_KEY or PRIVATE_KEY");
      return;
    }
    const service = new WalletService(rpcUrl);
    const sig = await service.signMessage(key, "test");
    assert.ok(typeof sig === "string");
    assert.ok(sig.startsWith("0x"));
  });
});
