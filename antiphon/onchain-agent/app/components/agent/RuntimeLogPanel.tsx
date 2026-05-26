"use client";

import { useEffect, useRef } from "react";
import type { ToolEvent } from "@/app/components/ToolLog";

type Props = {
  events: ToolEvent[];
  agentSlug: string;
  accentColor: string;
};

function RuntimeEventRow({
  event,
  accentColor,
}: {
  event: ToolEvent;
  accentColor: string;
}) {
  return (
    <div className="flex gap-2 text-[11px] font-mono border border-white/[0.06] rounded-lg px-3 py-2.5 bg-[#0d1117]/80">
      {event.status === "pending" ? (
        <span className="text-amber-500/90 shrink-0">⟳</span>
      ) : (
        <span className="shrink-0" style={{ color: accentColor }}>
          ✓
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-[#e2e8f0]">{event.tool}</span>
          {event.durationMs != null && event.status === "done" && (
            <span className="text-[#64748b]">{event.durationMs}ms</span>
          )}
        </div>
        <p className="text-[#94a3b8] mt-1 whitespace-pre-wrap break-words leading-relaxed">
          {event.status === "pending"
            ? event.query
              ? `q: ${event.query}`
              : "…"
            : event.preview || event.result.slice(0, 500)}
        </p>
      </div>
    </div>
  );
}

export function RuntimeLogPanel({ events, agentSlug, accentColor }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const pending = events.filter((e) => e.status === "pending").length;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [events.length, pending, events]);

  return (
    <div
      className="flex flex-col h-full min-h-0 rounded-2xl border border-white/[0.06] bg-[#0a0b0f]/90 overflow-hidden"
      style={{ borderTopColor: `${accentColor}44`, borderTopWidth: 2 }}
    >
      <div
        className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]"
        style={{ backgroundColor: `${accentColor}08` }}
      >
        <span className="label-caps text-[#64748b]">Runtime</span>
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse"
          style={{ backgroundColor: accentColor }}
        />
        <span className="text-[10px] font-mono text-[#64748b] truncate flex-1">
          {agentSlug}
        </span>
        <span className="text-[10px] text-[#94a3b8] shrink-0">
          {events.length} call{events.length !== 1 ? "s" : ""}
          {pending > 0 && ` · ${pending} active`}
        </span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0 p-3 space-y-2">
        {events.length === 0 ? (
          <p className="text-xs text-[#64748b] leading-relaxed px-1 py-8 text-center">
            Tool calls will appear here during a run.
          </p>
        ) : (
          events.map((e, i) => (
            <RuntimeEventRow key={`${e.timestamp}-${i}`} event={e} accentColor={accentColor} />
          ))
        )}
      </div>
    </div>
  );
}
