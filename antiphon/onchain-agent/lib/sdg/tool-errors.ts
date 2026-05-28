export type ErrorCategory =
  | "not_found"
  | "permission"
  | "validation"
  | "timeout"
  | "rate_limit"
  | "system_error";

export interface ToolErrorPayload {
  ok: false;
  error_category: ErrorCategory;
  message: string;
  retry_allowed: boolean;
}

export interface SdgToolResult<T = unknown> {
  ok: boolean;
  data?: T;
  error_category?: ErrorCategory;
  error?: string;
}

export function errorResult(category: ErrorCategory, message: string): ToolErrorPayload {
  const retry_allowed = category !== "permission" && category !== "system_error";
  return { ok: false, error_category: category, message, retry_allowed };
}

export const ERROR_CATEGORY_TEXT = {
  not_found:
    "No results found. Refine query or try a different source. Do not invent data.",
  permission:
    "Access denied to this source. Do not retry. Note the gap and offer to escalate.",
  validation:
    "Input rejected. Check field names and formats, then retry once with corrected input.",
  timeout:
    "Source timed out. Retry once with a narrower query or different source.",
  rate_limit:
    "Rate limit hit. Wait 10 seconds before retrying or use a different source.",
  system_error:
    "Source returned a system error. Do not retry. Note the failure and move to next workflow step.",
} as const;
