# Rachax402 AI Agent Coordination System: Powered by Storacha

![React](https://img.shields.io/badge/React-18.3-61dafb?logo=react)
![Vite](https://img.shields.io/badge/Vite-5.4-646cff?logo=vite)
![Wagmi](https://img.shields.io/badge/Wagmi-2.x-3396d6)
![Base Sepolia](https://img.shields.io/badge/Network-Base_Sepolia-0052ff)
![x402](https://img.shields.io/badge/Payments-x402-00d4aa)

**Pay-per-use AI agent marketplace** — upload files, run CSV analysis, or store on IPFS. All gated by x402 micropayments on Base Sepolia.

---

## What It Demonstrates

| Feature | Description |
|--------|-------------|
| **CSV Analysis** | Upload CSV → pay $0.0001 → get stats, insights, outlier detection |
| **File Storage** | Upload any file → pay $0.001 → get IPFS CID via Storacha |
| **x402 Payments** | Sign EIP-712 authorization → facilitator settles USDC on-chain |
| **Wallet Connect** | RainbowKit + wagmi for Base Sepolia |
| **Tx Verification** | Real settlement tx hash from `PAYMENT-RESPONSE` header |

---

## Backend Services

| Service | Port | Role |
|---------|------|------|
| **Storacha Storage** | `8000` | Upload/retrieve files on IPFS ($0.001/upload) |
| **AgentB Data Analyzer** | `8001` | CSV stats, numerical analysis ($0.0001/analysis) |

Both use x402 middleware: 402 → sign → retry with payment → settle on-chain.

---

## Frontend Flow

```mermaid
flowchart TB
    subgraph User
        A[Connect Wallet] --> B[Select Service]
        B --> C{Analyze or Store?}
    end

    subgraph Analyze["📊 Analyze Flow"]
        C -->|Analyze| D[Upload CSV to Storacha]
        D --> E[402 Payment Required]
        E --> F[Sign & Pay $0.001]
        F --> G[Get inputCID]
        G --> H[Request Analysis]
        H --> I[402 Payment Required]
        I --> J[Sign & Pay $0.0001]
        J --> K[AgentB Processes]
        K --> L[Results + resultCID]
    end

    subgraph Store["📁 Store Flow"]
        C -->|Store| M[402 Payment Required]
        M --> N[Sign & Pay $0.001]
        N --> O[Upload to Storacha]
        O --> P[Get CID]
    end

    L --> Q[View Stats, Insights, Tx Hash]
    P --> Q
```

---

## Quick Start

```bash
pnpm install
pnpm dev
```

**Prerequisites:** Storacha server (`:8000`) and AgentB server (`:8001`) running. See `../server/README.md`.

---

## Stack

- **UI:** React, Tailwind, Radix, Framer Motion
- **Web3:** wagmi, RainbowKit, viem
- **Payments:** @x402/core, @x402/evm (EIP-712 signing)
- **State:** Zustand
