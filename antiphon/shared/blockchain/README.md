# Wallet infrastructure (Agent A / Agent B)

- **WalletService** (`wallet.ts`): `createWalletClient(privateKey)`, `createPublicClient()`, `getBalance(address)`, `signMessage(privateKey, message)`, `getAccount(privateKey)`.
- **RPC**: `BASE_RPC_URL` (default `https://sepolia.base.org`). Timeout 15s, 2 retries.

## Forge + funding (Base Sepolia)

**No mainnet balance needed.** Base Sepolia is a testnet; use faucets only.

1. **Generate keys (Cast/Forge)**
   ```bash
   cast wallet new  # Agent A – copy private key and address
   cast wallet new  # Agent B – copy private key and address
   export ETH_RPC_URL=https://sepolia.base.org
   cast balance <wallet addr> --ether
   ```

2. **Fund with Base Sepolia ETH**
   - [Coinbase Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet) or [Alchemy Base Sepolia](https://www.alchemy.com/faucets/base-sepolia). Send to both agent addresses.

3. **Base Sepolia USDC for Agent A**
   - Use a Base Sepolia USDC faucet or bridge (e.g. Circle testnet faucet if available) and send to Agent A’s address so Requester can pay.

4. **`.env`**
   - `AGENT_A_PRIVATE_KEY=0x...` (Requester)
   - `AGENT_B_PRIVATE_KEY=0x...` (Provider)
   - `PAY_TO_ADDRESS=0x...` (Provider’s receive address, usually Agent B’s address)
   - `BASE_RPC_URL=https://sepolia.base.org` (or Alchemy/Infura URL)

Run wallet tests: `pnpm test`
