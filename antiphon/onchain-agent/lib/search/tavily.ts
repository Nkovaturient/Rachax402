import type { WebSearchPayload, WebSearchResult } from "./types";

type TavilyResponse = {
  results?: { title?: string; content?: string; url?: string }[];
  error?: string;
};

export async function searchTavily(query: string, maxResults = 5): Promise<WebSearchPayload> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    return {
      query,
      ok: false,
      results: [],
      error: "TAVILY_API_KEY is not configured.",
    };
  }

  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: "basic",
        max_results: maxResults,
        include_answer: false,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return {
        query,
        ok: false,
        results: [],
        error: `Tavily HTTP ${res.status}${text ? `: ${text.slice(0, 120)}` : ""}`,
      };
    }

    const data = (await res.json()) as TavilyResponse;
    const results: WebSearchResult[] = (data.results ?? [])
      .map((r) => ({
        title: (r.title ?? "").trim(),
        snippet: (r.content ?? "").trim().slice(0, 400),
        url: (r.url ?? "").trim(),
      }))
      .filter((r) => r.url.length > 0);

    return {
      query,
      ok: results.length > 0,
      results,
      ...(results.length === 0 ? { error: "No results returned." } : {}),
    };
  } catch (e) {
    return {
      query,
      ok: false,
      results: [],
      error: e instanceof Error ? e.message : "Search failed",
    };
  }
}
