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
