import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { withSentryConfig } from "@sentry/nextjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for Docker standalone output (Railway / Autonome deployment)
  output: "standalone",

  // Pin Turbopack root to this directory so lockfiles in parent dirs are ignored.
  // (production builds use --webpack, so this only affects dev mode)
  turbopack: {
    root: __dirname,
  },

  // Allow large file uploads in API routes
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },

  // ── Server-only packages ─────────────────────────────────────────────────────
  // Webpack skips bundling these and loads them from node_modules at runtime.
  // Required for packages using Node.js crypto / fs / wasm / native bindings.
  // "build" script uses --webpack so Turbopack (which ignores this) is not used.
  // Subpath imports must be listed individually — Webpack does not auto-cover them.
  serverExternalPackages: [
    // x402 payment protocol
    "@x402/fetch",
    "@x402/evm",
    "@x402/evm/exact/client",
    "@x402/core",
    "@x402/core/server",
    "@x402/express",

    // Coinbase AgentKit + CDP
    "@coinbase/agentkit",
    "@coinbase/agentkit-vercel-ai-sdk",
    "@coinbase/cdp-sdk",
    "@coinbase/x402",

    // Solana transitive deps from agentkit
    "@solana-program/token",
    "@solana-program/system",
    "@solana/web3.js",
    "@solana/spl-token",

    // Viem / ethers — use Node.js crypto
    "viem",
    "viem/accounts",
    "viem/chains",
    "ethers",

    // File parsers (SDG parse_uploaded_file) — Node APIs / dynamic requires
    "exceljs",
    "mammoth",
    "pdf-parse",
    "pdfjs-dist",
  ],
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  tunnelRoute: "/sentry-tunnel",
  // Suppress upload noise when DSN not configured
  silent: !process.env.SENTRY_AUTH_TOKEN,
  telemetry: false,
});