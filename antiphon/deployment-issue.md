**So, while I was deploying the `onchain-agent` sub-directory on Railway, I encountered several issues. My approach to fixing them is accounted below — to-the-point, succinctly.**

---

**`VOLUME` keyword banned on Railway**
Railway explicitly disallows the `VOLUME` instruction in Dockerfiles — it manages storage differently. Removed it entirely and replaced with `WALLET_DATA_JSON` env var seeding via `entrypoint.sh`.

---

**Custom start command conflict**
Had `npm run dev` set in Railway → Settings → Custom Start Command, which overrides the Dockerfile `CMD`. This started a dev server inside the production container. Removed it and let the Dockerfile `CMD ["/app/entrypoint.sh"]` take over.

---

**Turbopack ignores `serverExternalPackages`**
Next.js 16 defaults to Turbopack for builds. `serverExternalPackages` in `next.config.js` is Webpack-only — Turbopack silently ignores it, so Node-only packages like `@storacha/client` failed to bundle. Fixed by adding `--webpack` to the build script in `package.json`:
```json
"build": "next build --webpack"
```

---

**Missing dependencies in `package.json`**
`@storacha/client`, `@x402/fetch`, `@x402/evm`, `@x402/core`, `zod`, and `@coinbase/x402` were imported in the codebase but never declared as dependencies. `npm install` never fetched them, so Webpack correctly said "module not found." Added all six to `dependencies`.

---

**`multiformats` version conflict — `ERR_PACKAGE_PATH_NOT_EXPORTED`**
After installing `@storacha/client`, the build failed with:
```
Package subpath './link' is not defined by "exports" in multiformats/package.json
```
Storacha requires `multiformats@13` which exports `./link`. Another transitive dep was pulling in an older version that doesn't. Fixed with an npm `overrides` field to force the entire dep tree to v13:
```json
"overrides": { "multiformats": "^13.4.2" }
```

---

**`zod` v4 breaking change**
`npm install` resolved `zod` to v4 (just released). The entire codebase — AgentKit, Vercel AI SDK, and all provider tools — uses the v3 API. Pinned back:
```json
"zod": "^3.23.0"
```

---

**Wrong workspace root inference**
Next.js detected `pnpm-lock.yaml` in the parent monorepo directory and inferred the wrong workspace root, causing a warning about incomplete standalone output tracing. Added `outputFileTracingRoot` to `next.config.js`:
```js
outputFileTracingRoot: path.join(__dirname, "../../"),
```

---

**Heredoc in Dockerfile mis-parsed by linter**
The `RUN cat > entrypoint.sh << 'EOF' ... EOF` pattern embeds shell inside a `RUN` instruction. Dockerfile linters parse each line inside the heredoc as a Dockerfile instruction, flagging `SET`, `IF`, `ECHO`, `EXEC` as unknown. Moved the entrypoint script to a standalone `entrypoint.sh` file and used `COPY` instead:
```dockerfile
COPY --chown=nextjs:nodejs entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh
```

---

**Final build output — clean ✓**
```
▲ Next.js 16.2.0 (webpack)
✓ Compiled successfully in 3.2s
✓ Collecting page data using 6 workers in 2.5s
✓ Collecting build traces in 14.2s
Route (app)
├ ƒ /api/agent
└ ƒ /api/health
```

---

**The outputFileTracingRoot points to Rachax402/ (repo root), so Next.js mirrors the relative directory structure inside .next/standalone/. The server ends up at .next/standalone/antiphon/onchain-agent/server.js, not .next/standalone/server.js. The Dockerfile checks and copies the wrong paths.**

```
# After (correct — server.js lands at /app/server.js)
COPY .next/standalone/antiphon/onchain-agent   ./
COPY .next/standalone/node_modules             ./node_modules
```

---

### outputFileTracingRoot: path.join(__dirname, "../../") is environment-dependent:

Environment__dirnameTwo levels upStandalone pathLocal Mac/Users/matrix/DeFi/Rachax402/antiphon/onchain-agent/Users/matrix/DeFi/Rachax402/antiphon/onchain-agent/server.jsDocker (WORKDIR /app)/app/ (filesystem root)app/server.js or unpredictable
So the standalone output doesn't land at the path the Dockerfile expects — the build succeeds but the check fails.

### Fix — two files:
next.config.js — removed outputFileTracingRoot entirely (and the path/fileURLToPath imports). Without it, Next.js uses the project directory as root and server.js always lands at .next/standalone/server.js — consistent everywhere.
Dockerfile — reverted to the simple standard COPY:
`dockerfileCOPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./ `

- The pnpm workspace warning that outputFileTracingRoot was silencing is cosmetic — it doesn't affect the build or the running app.
- Git commit: fix: remove outputFileTracingRoot, standalone path now env-consistent

---

## chore(antiphon): remove stale packages, standardize on npm, fix Turbopack workspace root

**Root cause**
Next.js 16 Turbopack detects workspace roots by scanning for lockfiles walking up the directory tree. The root `antiphon/pnpm-lock.yaml` caused Turbopack to infer `antiphon/` as the workspace root, making CSS `@import "tailwindcss"` resolve from that directory instead of `onchain-agent/node_modules/`. Result: `Can't resolve 'tailwindcss'` on every page compile, plus Turbopack scanning the entire `antiphon/` tree (contracts/out, stale node_modules) causing heavy CPU/disk/memory load on macOS.

**Changes**

Removed stale directories and root orchestrator — `frontend/`, `shared/`, `plugins/`, root `index.ts`, `test-coordination.js`. None of these were imported by `onchain-agent`, `server`, or `mcp-server`. Root `package.json`, `tsconfig.json`, and `node_modules/` removed along with them.

Purged mixed package manager artifacts from `onchain-agent/` — deleted `pnpm-lock.yaml`, `pnpm-workspace.yaml` (was not a real workspace config), and `.yarnrc.yml`. Retained `package-lock.json` and `.npmrc` (`legacy-peer-deps=true`). The Dockerfile already declared npm as the sole authority.

Added `turbopack.root: __dirname` to `next.config.js` as a safety net — pins the Turbopack workspace root to `onchain-agent/` so any future lockfile added above the project cannot re-trigger the issue. Dev-mode only; production builds already use `--webpack`.

Cleared `.next/` after applying fixes — the Turbopack build graph in `.next/dev/build/` had `antiphon/` baked as the workspace root. `turbopack.root` alone does not invalidate this cache; a full wipe was required to pick up the corrected root on the next run.

**Verified**
```
▲ Next.js 16.2.0 (Turbopack)
✓ Ready in 167ms
GET / 200 in 1147ms   ← page compiled, no CSS errors, no lockfile warning
```

---

## **Documenting the integration of DeepSeek as the LLM provider for SDG research agents (sdg-01…sdg-17), replacing Anthropic for the research tier.**

---

**Goal**

Swap `createSdgAgent` from Anthropic (`claude-sonnet-4-6`) to DeepSeek (`deepseek-chat`) while keeping AgentA on Anthropic + AgentKit. Both providers share the same `streamText` pipeline in `route.ts`.

---

**Attempt 1 — `@ai-sdk/deepseek` (native provider)**

```ts
import { deepseek } from "@ai-sdk/deepseek";
// ...
model: deepseek("deepseek-chat"),
```

**Error (compile time):** `Type 'LanguageModelV3' is not assignable to type 'LanguageModelV2'`.

**Root cause:** `@ai-sdk/deepseek@2.0.35` targets `LanguageModelV3`. The `Agent` type in `create-agent.ts` was typed as `ReturnType<typeof anthropic>` → `LanguageModelV2`. Two incompatible specification versions.

**Fix applied:** Broadened `Agent.model` type. But compile-time silence doesn't fix runtime.

---

**Attempt 1b — Runtime failure**

```
Error [AI_UnsupportedModelVersionError]: Unsupported model version v3
for provider "deepseek.chat" and model "deepseek-chat".
AI SDK 5 only supports models that implement specification version "v2".
```

**Root cause:** `ai@5.0.156` (`streamText`) accepts only `LanguageModelV2`. The `@ai-sdk/deepseek` native provider returns V3 unconditionally. No compatibility flag exists.

**Verdict:** `@ai-sdk/deepseek` is incompatible with AI SDK 5. Requires AI SDK 6.

---

**Attempt 2 — `@ai-sdk/openai` (OpenAI-compatible route)**

DeepSeek's API is OpenAI-compatible (`https://api.deepseek.com/v1`). Use `@ai-sdk/openai` pointed at DeepSeek's base URL:

```ts
import { createOpenAI } from "@ai-sdk/openai";

const deepseek = createOpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com/v1",
});
// ...
model: deepseek("deepseek-chat"),
```

**Error (runtime):** Same `AI_UnsupportedModelVersionError`, now with `provider: "openai.responses"`.

**Root cause:** `@ai-sdk/openai@3.0.66` uses OpenAI's Responses API by default → returns `LanguageModelV3`. Same V2/V3 split, different provider name.

---

**Final fix — `@ai-sdk/openai@2.0.106` (chat completions, V2)**

- In @ai-sdk/openai@2.x, `createOpenAI()(modelId)` defaults to the **Responses** API. DeepSeek only supports Chat Completions — use `deepseek.chat(...)`, not `deepseek(...)`.
- Non-OpenAI model ids (e.g. `deepseek-chat`) are treated as “reasoning” models → system prompt is sent as `role: "developer"`. DeepSeek rejects that (400). Use SDK model id `gpt-4` for system-mode + a custom `fetch` that rewrites `model` to `deepseek-chat` (see `createDeepSeekProvider` in `create-agent.ts`).

`@ai-sdk/openai` v2.x uses `/chat/completions` (the older OpenAI endpoint) → `LanguageModelV2`. v3.x switched to the Responses API → V3.

```sh
npm install @ai-sdk/openai@2.0.106 --prefix ./onchain-agent
```

Verified at runtime:

```
specificationVersion: v2
provider: openai.responses
```

AI SDK 5 accepts this. Tools, streaming, `stopWhen`, and multi-turn memory all work identically through DeepSeek's OpenAI-compatible layer.

---

**Final `createSdgAgent` signature**

```ts
import { createOpenAI } from "@ai-sdk/openai";

async function createSdgAgent(slug: string): Promise<Agent> {
  if (!process.env.DEEPSEEK_API_KEY) {
    throw new Error("DEEPSEEK_API_KEY required in .env");
  }

  const deepseek = createOpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: "https://api.deepseek.com/v1",
  });

  // ... prompt + tools ...

  return {
    model: deepseek.chat("gpt-4"), // fetch rewrites to deepseek-chat; see createDeepSeekProvider
    system: fullSystem,
    tools,
    maxSteps: 12,
  };
}
```

**Env var:** `DEEPSEEK_API_KEY` in `.env` (separate from `ANTHROPIC_API_KEY`).


---

**Version compatibility table**

| Package | Version | Model version | Works with AI SDK 5? |
|---------|---------|---------------|----------------------|
| `@ai-sdk/anthropic` | 2.0.70 | V2 | Yes (AgentA) |
| `@ai-sdk/deepseek` | 2.0.35 | V3 | No |
| `@ai-sdk/openai` | 3.x | V3 | No |
| `@ai-sdk/openai` | 2.0.106 | V2 | Yes (SDG agents) |

---

**Key takeaway**

AI SDK 5 (`ai@5.x`) only accepts `LanguageModelV2`. Any provider that defaults to the newer API surface (Responses API, native V3) will fail with `AI_UnsupportedModelVersionError`. For DeepSeek specifically: use `@ai-sdk/openai@2` with `baseURL: "https://api.deepseek.com/v1"`. AI SDK 6, when adopted, will natively support all V3 providers — at which point the `@ai-sdk/openai` shim can be replaced with the native `@ai-sdk/deepseek` provider.


Looking across all(past and present) agentic responses, the message field is doing more than just describing what went wrong. It's giving agent the context it needs to make a specific decision, retry, ask for different input, explain a policy, escalate, or in the last case, escalate while keeping certain information confidential. saving context wndow, resources, token usage and graceful down.

This is the thing that separates a structured error response from a generic one. A generic error tells agent that something failed. A structured error tells agent what failed, whether trying again is worth it, and often what to do instead. The difference in agent's behaviour between receiving those two things is significant, you end up with an agent that handles failure gracefully rather than one that either loops pointlessly or produces a vague apology.