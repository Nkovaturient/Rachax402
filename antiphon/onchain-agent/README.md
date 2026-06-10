# Rachax402 — Onchain Agent

![Storacha](https://img.shields.io/badge/Storacha-red?logo=Storacha) ![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js) ![AgentKit](https://img.shields.io/badge/Coinbase-AgentKit-0052FF?logo=coinbase) ![Base](https://img.shields.io/badge/Base-Sepolia-0052FF) ![x402](https://img.shields.io/badge/x402-payments-10b981)

Two products, one app: **AgentA** (on-chain commerce orchestrator) and **17 SDG research agents** (cited evidence → action briefs).

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        LLM Hosts                                │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐    │
│  │ Next.js UI   │  │ Cursor /     │  │ Any MCP-compatible │    │
│  │ (this app)   │  │ Claude Desktop│  │ app                │    │
│  └──────┬───────┘  └──────┬───────┘  └────────┬───────────┘    │
│         │                 │                    │                │
│         ▼                 └────────┬───────────┘                │
│  ┌──────────────┐          ┌──────▼──────────┐                  │
│  │ AgentA:      │          │ @rachax402/     │                  │
│  │ AgentKit +   │          │ mcp-server      │                  │
│  │ ERC-8004 +   │          │ (stdio)         │                  │
│  │ x402 +       │          │ 8 tools         │                  │
│  │ Storacha     │          └──────┬──────────┘                  │
│  ├──────────────┤                 │                             │
│  │ SDG agents:  │                 │                             │
│  │ sdg-01…17    │                 │                             │
│  │ Research +   │                 │                             │
│  │ action briefs│                 │                             │
│  └──────┬───────┘                 │                             │
│         │                         │                             │
└─────────┼─────────────────────────┼─────────────────────────────┘
          │                         │
          ▼                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   On-Chain (Base Sepolia)                        │
│  ERC-8004 IdentityRegistry   0x1352abA587fF...                  │
│  ERC-8004 ReputationRegistry 0x3FdD300147...                    │
└─────────────────────────────────────────────────────────────────┘
          │  AgentA only: discoverAgents() → agentCard CID → IPFS → endpoint
          ▼
┌─────────────────────────────────────────────────────────────────┐
│               Railway Services (x402-gated)                     │
│  DataAnalyzer    POST /analyze   $0.01 USDC  0xEAB418...       │
│  StorachaStorage POST /upload    $0.10 USDC  0x9D48b6...       │
│                  GET  /retrieve  $0.005 USDC                    │
└─────────────────────────────────────────────────────────────────┘
```

## Products

| Product | Route | Stack | User outcome |
|---------|-------|-------|-------------|
| **AgentA** | `/agent/agenta` | AgentKit + ERC-8004 + x402 + Storacha | Discover → pay → verify on-chain services |
| **SDG agents** | `/agent/sdg-01`…`/agent/sdg-17` | SDG toolkit (5 tools): lookup, search, CSV, brief, escalate | Grounded evidence → analysis → action brief → human executes |

SDG agents never receive on-chain tools or protocol copy. Each is a lightweight persona overlay on a shared research toolkit.

## Agentic Services Workflow (AgentA only)

**CSV analyze**
```
User uploads CSV → discoverService('analyze') → stageCsvForAnalysis(filename)
→ X402 POST /analyze → 402 → sign EIP-712 → paid → resultCID + stats
→ checkCanRate → postReputation
```

**File store**
```
User uploads file → discoverService('store') → paidStoreFile(filename, endpoint)
→ X402 POST /upload → paid → CID
```

**File retrieve**
```
User types CID → discoverService('retrieve') → paidRetrieveFile(cid, endpoint)
→ X402 GET /retrieve → paid → file
```

File bytes are stored server-side (`file-context.ts`). Tools receive only `filename` — no base64 in LLM output.

## Getting Started

### Prerequisites

| Key | Source |
|-----|--------|
| `ANTHROPIC_API_KEY` | [Anthropic Console](https://console.anthropic.com/) |
| `CDP_API_KEY_NAME` + `CDP_API_KEY_PRIVATE_KEY` | [CDP Portal](https://portal.cdp.coinbase.com/) |
| `STORACHA_AGENT_PRIVATE_KEY` + `STORACHA_AGENT_DELEGATION` | Storacha CLI (`storacha key create`) |
| `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` | [Supabase Dashboard](https://supabase.com/dashboard) → Project Settings → API |
| `DATABASE_URL` + `DIRECT_URL` | Supabase → Project Settings → Database (pooler + direct) |
| `TAVILY_API_KEY` | [Tavily](https://tavily.com/) — powers SDG agent `search_verified_evidence` |

### Auth & Database (Supabase + Prisma)

1. Create a Supabase project and enable **Email (magic link)** and **Google** under Authentication → Providers.
2. Set **Site URL** to `http://localhost:3000` (and your production URL). Add redirect URL: `http://localhost:3000/auth/callback`.
3. Copy API keys and Postgres connection strings into `.env` (see `.env.example`).
4. Push schema:

```sh
npm run db:push    # or: npm run db:migrate
```

**Routes**

| Path | Access |
|------|--------|
| `/` | Public landing |
| `/marketplace` | Public — 17 SDG research agent cards |
| `/agent/agenta` | AgentA orchestrator (sign in to chat) |
| `/agent/sdg-01` … `/agent/sdg-17` | SDG arenas (public view; sign in to chat) |
| `/agent` | Redirects to `/marketplace` |
| `/login` | Magic link + Google sign-in |

Conversation history is scoped per `userId` + `agentSlug` in Postgres. Run `npm run db:push` after pulling to add the `agentSlug` column.

### Install & Run

```sh
cd onchain-agent
npm install
cp .env.example .env   # fill in keys
npm run db:push        # first-time schema
npm run dev            # http://localhost:3000
```

Sign in at `/login`, then open **AgentA** at `/agent/agenta` or browse SDG agents at `/marketplace`.

## MCP Server (`../mcp-server/`)

Standalone MCP server exposing the same ERC-8004 + x402 + Storacha capabilities to any LLM host via stdio transport.

### Tools Exposed

| Tool | Description |
|------|-------------|
| `discover_service` | Query ERC-8004 for capability → endpoint, price, reputation |
| `get_agent_reputation` | Read on-chain reputation score for any agent address |
| `stage_csv` | Free upload CSV to Storacha IPFS → inputCID |
| `analyze_csv` | Pay DataAnalyzer via x402, submit inputCID → resultCID + stats |
| `store_file` | Pay StorachaStorage via x402, upload file → CID |
| `retrieve_file` | Pay StorachaStorage via x402, retrieve by CID |
| `check_can_rate` | Check ERC-8004 rate limit before posting reputation |
| `post_reputation` | Post on-chain 1–5 rating with proof CID |

### Setup

```sh
cd mcp-server
npm install && npm run build
cp .env.example .env   # fill in RACHAX402_PRIVATE_KEY + Storacha keys
```

### Connect to Cursor

Add to `.cursor/mcp.json` (workspace root):

```json
{
  "mcpServers": {
    "rachax402": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-server/dist/index.js"]
    }
  }
}
```

### Connect to Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "rachax402": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-server/dist/index.js"]
    }
  }
}
```

## x402 Payment Flow (AgentA only)

```
AgentA (smart wallet)                  agentB-server          CDP Facilitator
      │                                      │                       │
      │  POST /analyze (no payment)          │                       │
      │─────────────────────────────────────▶│                       │
      │◀──── 402 + payment requirements ─────│                       │
      │                                      │                       │
      │  signs Permit2 message OFF-CHAIN     │                       │
      │  (costs 0 gas, instant)              │                       │
      │                                      │                       │
      │  POST /analyze + X-Payment: <sig>    │                       │
      │─────────────────────────────────────▶│                       │
      │                                      │──── POST /verify ────▶│
      │                                      │◀─── valid ────────────│
      │                                      │                       │
      │                                      │──── POST /settle ────▶│
      │                                      │     Permit2.permitWitness
      │                                      │     TransferFrom()    │
      │◀──── 200 + analysis result ──────────│                       │
```

## LLMOps

### Observability
Agent runs are traced via [Sentry AI Agents](https://docs.sentry.io/ai/monitoring/agents/dashboards/) — each `agentSlug` appears as a named agent with tool spans, token usage, latency, and cost. No separate trace storage is needed.

Set `SENTRY_DSN` (and `NEXT_PUBLIC_SENTRY_DSN`) to enable. Leave unset to disable silently.

### Prompt & model versioning
Every agent turn is tagged with a release (`AgentRelease` table). On first run, v1 is auto-seeded. To roll back:

- Via `/admin` → Release panel → Rollback button
- Via API: `POST /api/admin/releases` `{ agentSlug, version }`

Rollback invalidates the server-side agent cache instantly — no redeploy needed.

### Domain metrics
One `AgentTurnMetric` row is written per turn after the stream closes:

| Field | AgentA | SDG |
|-------|--------|-----|
| `x402Success` / `x402Usdc` | x402 payment outcome | — |
| `briefComplete` | — | All 5 sections present |
| `citationCount` | — | Tool-result URLs cited in reply |
| `escalated` | — | `escalate_for_human` called |
| `errorCategories` | tool error breakdown | tool error breakdown |

### Admin panel
`/admin` — protected by `ADMIN_EMAILS` env var (comma-separated Supabase emails).

Shows 7-day KPIs for AgentA (x402 success, USDC) and all SDG agents (brief quality, citations, escalations), per-slug error rate and p95 latency, and release rollback controls. Links out to Sentry for trace drill-down.

### Eval harness

```sh
npm run eval          # replay mode — no real API calls, runs in <1s
```

Golden fixtures in `eval/golden/`. Scorers: tool sequence, SDG brief completeness, AgentA routing safety (no X402ActionProvider on file upload), key-leakage check. Results compared against `eval/baseline.json`; exits non-zero on regression.

Run before activating a new release via `/admin`.

## On-Chain Contracts

| Contract | Address | Network |
|----------|---------|---------|
| ERC-8004 IdentityRegistry | `0x1352abA587fFbbC398d7ecAEA31e2948D3aFE4Fb` | Base Sepolia |
| ERC-8004 ReputationRegistry | `0x3FdD300147940a35F32AdF6De36b3358DA682B5c` | Base Sepolia |
| DataAnalyzer Agent | `0xEAB418143643557C74479d38E773A64E35B5f6c9` | Base Sepolia |
| StorachaStorage Agent | `0x9D48b65Bb45f144CBC5662Fd3Fd011659371D0f8` | Base Sepolia |

