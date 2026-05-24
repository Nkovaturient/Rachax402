# Getting Started


## File and Folder structure

`/src/AgentIdentityRegistry.sol` - contract that allows agents to register with their agent card CIDs, tags and enables discovery by capability tags

`/src/AgentReputationRegistry.sol` - contract for storing ratings and calculating reputation scores for agents with rate limiting

`/test/AgentIdentityRegistry.t.sol` - tests for AgentIdentityRegistry contract

`/test/AgentReputationRegistry.t.sol` - tests for AgentReputationRegistry contract



## Build and Testing

- Install **foundry** if not installed already. You can follow the below steps:
```bash
curl -L https://foundry.paradigm.xyz | bash
source ~/.bashrc 
foundryup
```

- To install necessary libraries and build the contracts, run:
```bash
cd antiphon/contracts/rachax402
forge install foundry-rs/forge-std
forge build
```

- To test the contracts, run:
```bash
cd antiphon/contracts/rachax402

# for AgentIdentityRegistry contract
forge test --match-contract AgentIdentityRegistryTest -vvv

# for AgentReputationRegistry contract
forge test --match-contract AgentReputationRegistryTest -vvv

# for StorageReference Behavior contract Test
forge test --match-contract StorageReferenceDeleteBehaviorTest -vvv

# for fuzz testing
forge test --match-contract AgentReputationRegistryFuzzTest -vvv
forge test --match-contract AgentIdentityRegistryFuzzTest -vvv

# for invariant testing
forge test --match-contract AgentReputationRegistryInvariantTest -vvv
forge test --match-contract AgentIdentityRegistryInvariantTest -vvv
```

- To check the coverage report, run:
```bash
cd antiphon/contracts/rachax402
forge coverage
```


## Deploy Contract on Anvil(testing locally)

- To deploy the contracts on Anvil(locally), run:
```bash
cd antiphon/contracts/rachax402

# first terminal
anvil

# second terminal, deploy both contracts together(recommended)
forge script script/Deploy.s.sol:Deploy --broadcast --rpc-url http://localhost:854

# Deploy contracts separately
# Deploy Identity Registry
forge script script/DeployAgentIdentityRegistry.s.sol --rpc-url http://localhost:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --broadcast

# Deploy Reputation Registry
forge script script/DeployAgentReputationRegistry.s.sol --rpc-url http://localhost:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --broadcast
```

> Note: private key used here is test key provided by anvil, do not use in production environment


## Deploy Contract on Base Sepolia Testnet

- To deploy the contracts on Base Sepolia Testnet, run:
```bash
# deploy identity registry contract
forge script ./script/DeployAgentIdentityRegistry.s.sol --rpc-url $BASE_SEPOLIA_RPC_URL --private-key $PRIVATE_KEY --broadcast --verify --etherscan-api-key $ETHERSCAN_API_KEY -vvvv

# deploy reputation registry contract
forge script ./script/DeployAgentReputationRegistry.s.sol --rpc-url $BASE_SEPOLIA_RPC_URL --private-key $PRIVATE_KEY --broadcast --verify --etherscan-api-key $ETHERSCAN_API_KEY -vvvv
```

> Or, directly interact with the deployed contracts using the following addresses and ABIs on Etherscan


## Deploy Contract on Base Mainnet

**Prerequisites:** Copy `.env.example` to `.env` and set:
- `BASE_MAINNET_RPC_URL` – Alchemy/Infura Base mainnet RPC (e.g. `https://base-mainnet.g.alchemy.com/v2/YOUR_KEY`)
- `BASESCAN_API_KEY` – API key from [basescan.org](https://basescan.org/myapikey)
- `PRIVATE_KEY` – Deployer wallet private key (with enough ETH on Base for gas)

**Recommended flow (dry-run first, then deploy):**

```bash
cd antiphon/contracts/rachax402

# 1. Dry run (simulate without broadcasting)
forge script script/Deploy.s.sol:DeployAll --rpc-url $BASE_MAINNET_RPC_URL --private-key $PRIVATE_KEY -vvvv

# 2. Deploy both contracts and verify on Basescan
forge script script/Deploy.s.sol:DeployAll --rpc-url $BASE_MAINNET_RPC_URL --private-key $PRIVATE_KEY --broadcast --verify --chain-id 8453 --etherscan-api-key $BASESCAN_API_KEY -vvvv
```

**Deploy contracts separately:**

```bash
# AgentIdentityRegistry
forge script script/DeployAgentIdentityRegistry.s.sol:DeployAgentIdentityRegistry --rpc-url $BASE_MAINNET_RPC_URL --private-key $PRIVATE_KEY --broadcast --verify --chain-id 8453 --etherscan-api-key $BASESCAN_API_KEY -vvvv

# AgentReputationRegistry
forge script script/DeployAgentReputationRegistry.s.sol:DeployAgentReputationRegistry --rpc-url $BASE_MAINNET_RPC_URL --private-key $PRIVATE_KEY --broadcast --verify --chain-id 8453 --etherscan-api-key $BASESCAN_API_KEY -vvvv
```

**Alternative (using foundry.toml):** If `BASE_MAINNET_RPC_URL` and `BASESCAN_API_KEY` are set in `.env`, you can use:
```bash
forge script script/Deploy.s.sol:DeployAll --rpc-url $BASE_MAINNET_RPC_URL --private-key $PRIVATE_KEY --broadcast --verify --chain base -vvvv
```

**Safety notes:**
- Always run a dry run first (omit `--broadcast`) to confirm gas and behavior
- Ensure the deployer wallet has sufficient ETH on Base mainnet for gas
- Both contracts have no constructor args; deployment is deterministic


## Deployed Contracts Address(Base Sepolia Testnet)

- Both Contracts are deployed on Base Sepolia Testnet and Verified successfully on Etherscan
```bash
ERC8004_IDENTITY_REGISTRY=0x1352abA587fFbbC398d7ecAEA31e2948D3aFE4Fb
ERC8004_REPUTATION_REGISTRY=0x3FdD300147940a35F32AdF6De36b3358DA682B5c
```

- Transaction Hashes for deployment:
```bash
IDENTITY_REGISTRY_DEPLOYMENT_TX_HASH=0x475ece37b46f9f5c7736b99d7730cd4aa95dfea234d0340e367db071a04368bf
REPUTATION_REGISTRY_DEPLOYMENT_TX_HASH=0x8d838194a700bb36723804d918df19359a8e540b583937ea4dba8f968ee499d5
```


## Get your alchemy API Keys

- Visit: `https://dashboard.alchemy.com/` and create a free account to get api keys and rpc urls for different testnets and mainnets.


----

# Getting Started

## File and Folder Structure

| File | Description |
|---|---|
| `/src/AgentIdentityRegistry.sol` | Agent registration, CID storage, capability-tag discovery |
| `/src/AgentReputationRegistry.sol` | Ratings, reputation scores, rate limiting |
| `/test/AgentIdentityRegistry.t.sol` | Unit tests for Identity contract |
| `/test/AgentReputationRegistry.t.sol` | Unit tests for Reputation contract |
| `/script/Deploy.s.sol` | Deploys both contracts in order (recommended) |
| `/script/DeployAgentIdentityRegistry.s.sol` | Standalone Identity deploy |
| `/script/DeployAgentReputationRegistry.s.sol` | Standalone Reputation deploy (reads `AGENT_IDENTITY_REGISTRY` from env) |

---

## Build and Testing

**Install Foundry** (skip if already installed):
```bash
curl -L https://foundry.paradigm.xyz | bash
source ~/.bashrc
foundryup
```

**Build:**
```bash
cd antiphon/contracts/rachax402
forge install foundry-rs/forge-std
forge build
```

**Run tests:**
```bash
cd antiphon/contracts/rachax402

# Unit tests
forge test --match-contract AgentIdentityRegistryTest -vvv
forge test --match-contract AgentReputationRegistryTest -vvv
forge test --match-contract StorageReferenceDeleteBehaviorTest -vvv

# Fuzz tests
forge test --match-contract AgentReputationRegistryFuzzTest -vvv
forge test --match-contract AgentIdentityRegistryFuzzTest -vvv

# Invariant tests
forge test --match-contract AgentReputationRegistryInvariantTest -vvv
forge test --match-contract AgentIdentityRegistryInvariantTest -vvv

# Coverage report
forge coverage
```

---

## Deploy Locally (Anvil)

```bash
cd antiphon/contracts/rachax402

# Terminal 1
anvil

# Terminal 2 — deploy both together (recommended)
forge script script/Deploy.s.sol:DeployAll --broadcast --rpc-url http://localhost:8545

# Or deploy separately (uses Anvil's default test key — never use in production)
forge script script/DeployAgentIdentityRegistry.s.sol \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --broadcast

# After Identity is deployed, set its address then deploy Reputation:
export AGENT_IDENTITY_REGISTRY=<identity_address_from_above>
forge script script/DeployAgentReputationRegistry.s.sol \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --broadcast
```

---

## Deploy on Base Sepolia (Testnet)

**Set env vars:**
```bash
export BASE_SEPOLIA_RPC_URL=https://base-sepolia.g.alchemy.com/v2/YOUR_KEY
export BASESCAN_API_KEY=your_basescan_api_key
export PRIVATE_KEY=your_deployer_private_key
```

**Deploy:**
```bash
cd antiphon/contracts/rachax402

# Deploy Identity
forge script script/DeployAgentIdentityRegistry.s.sol:DeployAgentIdentityRegistry \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast --verify \
  --etherscan-api-key $BASESCAN_API_KEY -vvvv

# Deploy Reputation (pass Identity address)
export AGENT_IDENTITY_REGISTRY=<identity_address_from_above>
forge script script/DeployAgentReputationRegistry.s.sol:DeployAgentReputationRegistry \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast --verify \
  --etherscan-api-key $BASESCAN_API_KEY -vvvv
```

**Already deployed on Base Sepolia (old versions — pre-audit fixes):**
```
ERC8004_IDENTITY_REGISTRY   = 0x1352abA587fFbbC398d7ecAEA31e2948D3aFE4Fb
ERC8004_REPUTATION_REGISTRY = 0x3FdD300147940a35F32AdF6De36b3358DA682B5c
```

---

## Deploy on Base Mainnet

### ETH Required

Base is an L2 — gas costs are very low.

| Item | Estimated Gas | Cost at 0.01 gwei | Cost at 0.1 gwei (spike) |
|---|---|---|---|
| AgentIdentityRegistry deploy | ~1,800,000 | ~$0.05 | ~$0.50 |
| AgentReputationRegistry deploy | ~1,500,000 | ~$0.04 | ~$0.40 |
| `transferOwnership` (×2) | ~30,000 | <$0.01 | <$0.05 |
| **Total** | **~3,330,000** | **~$0.10** | **~$1.00** |

**Recommendation: keep 0.005 ETH (~$10–15 at current prices) in the deployer wallet.** This gives a 10–15× buffer against gas spikes and leaves room for post-deploy ownership transfers.

> Get ETH on Base: bridge from Ethereum mainnet via [bridge.base.org](https://bridge.base.org), or buy directly on Coinbase and withdraw to Base.

---

### Prerequisites

Copy `.env.example` to `.env` and fill in:

```bash
BASE_MAINNET_RPC_URL=https://base-mainnet.g.alchemy.com/v2/YOUR_KEY   # Alchemy or Infura
BASESCAN_API_KEY=your_key_from_basescan.org                            # basescan.org/myapikey
PRIVATE_KEY=your_deployer_eoa_private_key                             # EOA with ETH on Base
MULTISIG_ADDRESS=your_gnosis_safe_address                              # 3-of-5 Safe for ownership
```

> **Never commit `.env` to git.** Add it to `.gitignore`.

---

### Mainnet Deploy — Step by Step

**Step 1 — Dry run (no broadcast, confirms gas + behavior):**
```bash
cd antiphon/contracts/rachax402

forge script script/Deploy.s.sol:DeployAll \
  --rpc-url $BASE_MAINNET_RPC_URL \
  --private-key $PRIVATE_KEY \
  -vvvv
```
Check the output: confirm both constructors simulate cleanly, no reverts, gas estimates look right.

**Step 2 — Deploy + verify on Basescan:**
```bash
forge script script/Deploy.s.sol:DeployAll \
  --rpc-url $BASE_MAINNET_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast --verify \
  --chain-id 8453 \
  --etherscan-api-key $BASESCAN_API_KEY \
  -vvvv
```
This deploys Identity first, then Reputation (passing Identity's address to its constructor), and auto-verifies both on Basescan.

**Step 3 — Transfer ownership to your multisig (do this immediately):**
```bash
# Using cast — transfers owner on both contracts from EOA to your Gnosis Safe
cast send <IDENTITY_ADDRESS> "transferOwnership(address)" $MULTISIG_ADDRESS \
  --rpc-url $BASE_MAINNET_RPC_URL \
  --private-key $PRIVATE_KEY

cast send <REPUTATION_ADDRESS> "transferOwnership(address)" $MULTISIG_ADDRESS \
  --rpc-url $BASE_MAINNET_RPC_URL \
  --private-key $PRIVATE_KEY
```

**Step 4 — Confirm on Basescan:**
```bash
# Verify owner is now the multisig (should return MULTISIG_ADDRESS)
cast call <IDENTITY_ADDRESS>   "owner()" --rpc-url $BASE_MAINNET_RPC_URL
cast call <REPUTATION_ADDRESS> "owner()" --rpc-url $BASE_MAINNET_RPC_URL

# Verify Reputation points at the correct Identity
cast call <REPUTATION_ADDRESS> "identityRegistry()" --rpc-url $BASE_MAINNET_RPC_URL
```

**Step 5 — (Optional) Separate deploys if Deploy.s.sol isn't set up:**
```bash
# Identity
forge script script/DeployAgentIdentityRegistry.s.sol:DeployAgentIdentityRegistry \
  --rpc-url $BASE_MAINNET_RPC_URL --private-key $PRIVATE_KEY \
  --broadcast --verify --chain-id 8453 --etherscan-api-key $BASESCAN_API_KEY -vvvv

# Reputation (set Identity address first)
export AGENT_IDENTITY_REGISTRY=<identity_address>
forge script script/DeployAgentReputationRegistry.s.sol:DeployAgentReputationRegistry \
  --rpc-url $BASE_MAINNET_RPC_URL --private-key $PRIVATE_KEY \
  --broadcast --verify --chain-id 8453 --etherscan-api-key $BASESCAN_API_KEY -vvvv
```

---

### Post-Deploy Checklist

```
[ ] Both contracts verified and source visible on basescan.org
[ ] owner() returns your Gnosis Safe address on both contracts
[ ] identityRegistry() on Reputation returns the correct Identity address
[ ] paused() returns false on both contracts
[ ] Set up Tenderly alerts on: pause(), adminRemoveAgent(), removeRating(), transferOwnership()
[ ] Monitor for unusual registration volume for first 7 days
[ ] Update this README with mainnet addresses and tx hashes (see format below)
```

---

## Deployed Contracts

### Base Sepolia Testnet (pre-audit — old versions)
```
ERC8004_IDENTITY_REGISTRY              = 0x1352abA587fFbbC398d7ecAEA31e2948D3aFE4Fb
ERC8004_REPUTATION_REGISTRY            = 0x3FdD300147940a35F32AdF6De36b3358DA682B5c
IDENTITY_REGISTRY_DEPLOYMENT_TX_HASH  = 0x475ece37b46f9f5c7736b99d7730cd4aa95dfea234d0340e367db071a04368bf
REPUTATION_REGISTRY_DEPLOYMENT_TX_HASH= 0x8d838194a700bb36723804d918df19359a8e540b583937ea4dba8f968ee499d5
```

### Base Mainnet
```
ERC8004_IDENTITY_REGISTRY            = 0x2Ad463E1f6783e610504A1027D6AdE8b2DcF10b2
ERC8004_REPUTATION_REGISTRY          = 0x96EE446A832b7AdcF598C4B2340131f622677c25
IDENTITY_REGISTRY_DEPLOYMENT_TX      = https://basescan.org/address/0x2Ad463E1f6783e610504A1027D6AdE8b2DcF10b2
REPUTATION_REGISTRY_DEPLOYMENT_TX    = https://basescan.org/address/0x96EE446A832b7AdcF598C4B2340131f622677c25
```

---

## Get API Keys

- **Alchemy RPC:** [dashboard.alchemy.com](https://dashboard.alchemy.com) — free tier covers mainnet
- **Basescan API:** [basescan.org/myapikey](https://basescan.org/myapikey) — needed for contract verification
- **Gnosis Safe (multisig):** [app.safe.global](https://app.safe.global) — create a 3-of-5 Safe on Base before deploying