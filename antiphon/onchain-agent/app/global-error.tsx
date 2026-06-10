"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0a0f1a] text-white flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-xl font-semibold">Something went wrong</h1>
          <p className="text-sm text-white/60">
            An unexpected error occurred. The team has been notified.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="px-4 py-2 rounded-lg text-sm border border-white/20 hover:border-white/40 transition"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
