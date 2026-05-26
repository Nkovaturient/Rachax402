export type WebSearchResult = { title: string; snippet: string; url: string };

export type WebSearchPayload = {
  query: string;
  ok: boolean;
  results: WebSearchResult[];
  error?: string;
};
