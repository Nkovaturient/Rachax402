import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.2,
  // vercelAIIntegration not needed on edge — agent route runs on Node runtime
  enabled: !!process.env.SENTRY_DSN,
});
