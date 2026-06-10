import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.2,
  integrations: [
    // force: true required because Next.js bundles `ai` — auto-detection won't fire
    Sentry.vercelAIIntegration({ force: true }),
  ],
  enabled: !!process.env.SENTRY_DSN,
});
