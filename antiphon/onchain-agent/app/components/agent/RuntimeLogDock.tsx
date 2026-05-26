"use client";

import { useState } from "react";
import type { ToolEvent } from "@/app/components/ToolLog";

type Props = {
  events: ToolEvent[];
  agentSlug: string;
};

export function RuntimeLogDock({ events, agentSlug }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (events.length === 0) return null;

  const pending = events.filter((e) => e.status === "pending").length;
  const latest = events[events.length - 1];

  return (
    <div className="shrink-0 border-t border-white/10 bg-[#0a0b0f]/95 backdrop-blur-md">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white/[0.03] transition"
      >
        <span className="label-caps text-[#64748b] shrink-0">Runtime</span>
        <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse shrink-0" />
        <span className="text-[11px] font-mono text-[#94a3b8] truncate flex-1">
          {latest.tool}
          {latest.status === "pending" ? " · running" : latest.preview ? ` · ${latest.preview.split("\n")[0].slice(0, 72)}` : ""}
        </span>
        <span className="text-[10px] text-[#64748b] shrink-0">
          {events.length} call{events.length !== 1 ? "s" : ""}
          {pending > 0 && ` · ${pending} active`}
        </span>
        <span className="text-[10px] text-white/30 shrink-0">{expanded ? "▾" : "▸"}</span>
      </button>

      {expanded && (
        <div className="px-4 pb-3 max-h-48 overflow-y-auto space-y-2 border-t border-white/5">
          {events.map((e, i) => (
            <div
              key={i}
              className="flex gap-2 text-[11px] font-mono border border-white/5 rounded-lg px-3 py-2 bg-black/30"
            >
              {e.status === "pending" ? (
                <span className="text-amber-400/80 shrink-0">⟳</span>
              ) : (
                <span className="text-[#10b981]/80 shrink-0">✓</span>
              )}
              <div className="min-w-0 flex-1">
                <span className="text-[#8b5cf6]">{e.tool}</span>
                {e.durationMs != null && e.status === "done" && (
                  <span className="text-[#64748b] ml-2">{e.durationMs}ms</span>
                )}
                <p className="text-[#94a3b8] mt-0.5 whitespace-pre-wrap break-all">
                  {e.status === "pending"
                    ? e.query
                      ? `q: ${e.query}`
                      : "…"
                    : e.preview || e.result.slice(0, 300)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
