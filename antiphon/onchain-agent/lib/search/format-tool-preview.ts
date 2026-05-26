import type { WebSearchPayload } from "./types";

export function formatWebSearchPreview(payload: WebSearchPayload): string {
  const lines = [`q: ${payload.query}`];
  if (payload.error) lines.push(payload.error);
  for (const r of payload.results.slice(0, 2)) {
    lines.push(`• ${r.title || r.url}: ${r.snippet.slice(0, 80)}…`);
  }
  return lines.join("\n");
}

export function parseToolResultPreview(
  toolName: string,
  result: unknown,
): { query?: string; preview: string } {
  if (toolName === "web_search") {
    let payload: WebSearchPayload | null = null;
    if (typeof result === "string") {
      try {
        payload = JSON.parse(result) as WebSearchPayload;
      } catch {
        return { preview: result.slice(0, 200) };
      }
    } else if (result && typeof result === "object") {
      payload = result as WebSearchPayload;
    }
    if (payload) {
      return { query: payload.query, preview: formatWebSearchPreview(payload) };
    }
  }

  const text =
    typeof result === "string" ? result : JSON.stringify(result ?? "");
  return { preview: text.length > 240 ? `${text.slice(0, 240)}…` : text };
}
