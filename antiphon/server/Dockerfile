# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Rachax402 AgentB Services — server/Dockerfile
#
# Deploys TWO separate Railway services from one image:
#   SERVICE_TYPE=analyzer → agentB-server.js  (PORT=8001)
#   SERVICE_TYPE=storage  → pinata-server.js (PORT=8000)
#
# Build locally:
#   docker build -t rachax402-server .
#   docker run --env-file .env -e SERVICE_TYPE=analyzer -p 8001:8001 rachax402-server
#   docker run --env-file .env -e SERVICE_TYPE=storage  -p 8000:8000 rachax402-server
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FROM node:20-alpine AS deps
WORKDIR /app

# System deps required by some native Node addons (viem, etc.)
RUN apk add --no-cache python3 make g++

# Copy manifests first for layer caching
COPY package.json ./
# Support both npm and pnpm lockfiles (Railway uses whichever exists)
COPY package-lock.json* pnpm-lock.yaml* ./

# Install PRODUCTION deps only — no devDependencies in the image
RUN npm install --omit=dev --frozen-lockfile 2>/dev/null || \
    npm install --omit=dev

# ── Runtime stage ─────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

# Non-root user for security
RUN addgroup --system --gid 1001 agentb && \
    adduser  --system --uid 1001 --ingroup agentb agentb

# Copy prod node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy ONLY the server source files needed at runtime.
# DO NOT copy .env — secrets are injected as Railway env vars.
COPY --chown=agentb:agentb agentB-server.js   .
COPY --chown=agentb:agentb pinata-server.js  .
COPY --chown=agentb:agentb initPinata.js     .
COPY --chown=agentb:agentb package.json       .

USER agentb

# ── Health check ──────────────────────────────────────────────────
# analyzer → PROVIDER_PORT (default 8001); storage → PORT (default 8000)
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD sh -c 'if [ "$SERVICE_TYPE" = "analyzer" ]; then \
    wget -qO- "http://localhost:${PROVIDER_PORT:-8001}/health" || exit 1; \
  else \
    wget -qO- "http://localhost:${PORT:-8000}/health" || exit 1; \
  fi'

# ── Entrypoint ────────────────────────────────────────────────────
CMD ["sh", "-c", "\
  if [ \"$SERVICE_TYPE\" = 'analyzer' ]; then \
    echo '🔬 Starting DataAnalyzer on port '${PORT:-${PROVIDER_PORT:-8001}}'...'; \
    node agentB-server.js; \
  elif [ \"$SERVICE_TYPE\" = 'storage' ]; then \
    echo '📦 Starting IpfsStorage on port '${PORT:-8000}'...'; \
    node pinata-server.js; \
  else \
    echo '❌ SERVICE_TYPE env var must be \"analyzer\" or \"storage\"'; \
    exit 1; \
  fi"]
