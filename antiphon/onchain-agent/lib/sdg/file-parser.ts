/**
 * file-parser.ts — multi-format upload parser for SDG agents.
 *
 * Tabular formats (CSV, XLSX) share one column-stats path so the agent gets
 * the same structured insight. Document formats (PDF, DOCX, TXT, MD, JSON)
 * return capped extracted text. Unknown formats return a clear "not supported"
 * result instead of a superficial answer.
 */

import ExcelJS from "exceljs";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import type { SdgToolResult } from "./tool-errors";

export const SUPPORTED_FORMATS = ["pdf", "docx", "xlsx", "csv", "txt", "md", "json"] as const;
export const SUPPORTED_LABEL = "PDF, DOCX, XLSX, CSV, TXT, MD, JSON";

const MAX_TEXT_CHARS = 16000;
const SAMPLE_ROWS = 3;
const MAX_STAT_COLUMNS = 40;

interface PendingFile {
  base64: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
}

function extOf(filename: string): string {
  const i = filename.lastIndexOf(".");
  return i === -1 ? "" : filename.slice(i + 1).toLowerCase();
}

// ── Tabular ──────────────────────────────────────────────────────────────────

function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length === 0) return { headers: [], rows: [] };

  const splitLine = (line: string): string[] => {
    const cells: string[] = [];
    let inQuotes = false;
    let cell = "";
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === "," && !inQuotes) { cells.push(cell.trim()); cell = ""; continue; }
      cell += ch;
    }
    cells.push(cell.trim());
    return cells;
  };

  const headers = splitLine(lines[0]).map((h) => h.replace(/^"|"$/g, ""));
  const rows = lines.slice(1).map(splitLine);
  return { headers, rows };
}

function cellToString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "object") {
    const v = value as Record<string, unknown>;
    if ("text" in v) return String(v.text);
    if ("result" in v) return String(v.result);
    if ("richText" in v && Array.isArray(v.richText)) {
      return (v.richText as Array<{ text?: string }>).map((r) => r.text ?? "").join("");
    }
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    if ("hyperlink" in v) return String(v.text ?? v.hyperlink);
  }
  return String(value);
}

async function parseXlsx(buffer: Buffer): Promise<{ headers: string[]; rows: string[][] }> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as unknown as ArrayBuffer);
  const ws = wb.worksheets[0];
  if (!ws) return { headers: [], rows: [] };

  const all: string[][] = [];
  ws.eachRow((row) => {
    const values = Array.isArray(row.values) ? row.values.slice(1) : [];
    all.push(values.map(cellToString));
  });
  if (all.length === 0) return { headers: [], rows: [] };
  return { headers: all[0], rows: all.slice(1) };
}

function computeTabularStats(headers: string[], rows: string[][]) {
  return headers.slice(0, MAX_STAT_COLUMNS).map((col, i) => {
    const values = rows.map((r) => r[i] ?? "").filter((v) => v !== "");
    const numericValues = values.map((v) => parseFloat(v)).filter((n) => !isNaN(n));
    const nullCount = rows.length - values.length;

    const base = {
      column: col,
      non_null: values.length,
      null_pct: rows.length > 0 ? ((nullCount / rows.length) * 100).toFixed(1) + "%" : "0%",
    };

    if (numericValues.length > 0 && numericValues.length >= values.length * 0.6) {
      const sorted = [...numericValues].sort((a, b) => a - b);
      return {
        ...base,
        type: "numeric",
        min: sorted[0],
        max: sorted[sorted.length - 1],
        mean: (numericValues.reduce((a, b) => a + b, 0) / numericValues.length).toFixed(2),
        median: sorted[Math.floor(sorted.length / 2)],
      };
    }
    return {
      ...base,
      type: "text",
      unique_values: new Set(values).size,
      sample_values: [...new Set(values)].slice(0, 5),
    };
  });
}

function tabularResult(filename: string, format: string, headers: string[], rows: string[][]): SdgToolResult {
  if (headers.length === 0 || rows.length === 0) {
    return {
      ok: false,
      error_category: "validation",
      error: `${format.toUpperCase()} appears empty or has only a header row. Check the file.`,
    };
  }
  return {
    ok: true,
    data: {
      filename,
      format,
      total_rows: rows.length,
      total_columns: headers.length,
      columns: computeTabularStats(headers, rows),
      sample_rows: rows.slice(0, SAMPLE_ROWS).map((r) =>
        Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ""])),
      ),
    },
  };
}

// ── Document text ────────────────────────────────────────────────────────────

function cap(text: string): { text: string; truncated: boolean; char_count: number } {
  const clean = text.replace(/\n{3,}/g, "\n\n").trim();
  if (clean.length <= MAX_TEXT_CHARS) {
    return { text: clean, truncated: false, char_count: clean.length };
  }
  return { text: clean.slice(0, MAX_TEXT_CHARS), truncated: true, char_count: clean.length };
}

function textResult(filename: string, format: string, raw: string, extra?: Record<string, unknown>): SdgToolResult {
  const { text, truncated, char_count } = cap(raw);
  if (char_count === 0) {
    return {
      ok: false,
      error_category: "validation",
      error: `No readable text could be extracted from this ${format.toUpperCase()} file.`,
    };
  }
  return { ok: true, data: { filename, format, char_count, truncated, ...extra, text } };
}

// ── Dispatch ─────────────────────────────────────────────────────────────────

export async function parseUploadedFile(pending: PendingFile): Promise<SdgToolResult> {
  const buffer = Buffer.from(pending.base64, "base64");
  const ext = extOf(pending.filename);
  const format = ext || "unknown";

  try {
    switch (ext) {
      case "csv":
      case "tsv": {
        const { headers, rows } = parseCsv(buffer.toString("utf-8"));
        return tabularResult(pending.filename, "csv", headers, rows);
      }
      case "xlsx": {
        const { headers, rows } = await parseXlsx(buffer);
        return tabularResult(pending.filename, "xlsx", headers, rows);
      }
      case "docx": {
        const { value } = await mammoth.extractRawText({ buffer });
        return textResult(pending.filename, "docx", value);
      }
      case "pdf": {
        const parser = new PDFParse({ data: new Uint8Array(buffer) });
        try {
          const result = await parser.getText();
          return textResult(pending.filename, "pdf", result.text, { page_count: result.total });
        } finally {
          await parser.destroy();
        }
      }
      case "txt":
      case "md":
      case "json":
        return textResult(pending.filename, ext, buffer.toString("utf-8"));
      default:
        return {
          ok: false,
          error_category: "validation",
          error: `File format not supported. Try uploading: ${SUPPORTED_LABEL}.`,
        };
    }
  } catch {
    return {
      ok: false,
      error_category: "system_error",
      error: `Failed to parse ${format.toUpperCase()} file. It may be corrupt, password-protected, or scanned (image-only).`,
    };
  }
}
