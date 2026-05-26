"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useAgent, type AgentChatBindings } from "@/app/hooks/useAgent";
import { ToolLog } from "@/app/components/ToolLog";
import { AgentMarkdown } from "@/app/components/AgentMarkdown";

const PIN_THRESHOLD_PX = 80;

type Props = {
  agentSlug: string;
  headerLabel: string;
  placeholder?: string;
  emptyTitle?: string;
  emptyHint?: string;
  exampleTasks?: string[];
  className?: string;
  hideToolLog?: boolean;
  variant?: "drawer" | "center" | "workspace";
  agentBindings?: AgentChatBindings;
  accentColor?: string;
  conversationId?: string | null;
};

export function AgentChatPanel(props: Props) {
  if (props.agentBindings) {
    return <AgentChatPanelInner {...props} bindings={props.agentBindings} />;
  }
  return <AgentChatPanelWithHook {...props} />;
}

function AgentChatPanelWithHook(props: Props) {
  const bindings = useAgent(props.agentSlug);
  return <AgentChatPanelInner {...props} bindings={bindings} />;
}

function AgentChatPanelInner({
  agentSlug,
  headerLabel,
  placeholder = "Ask a question…",
  emptyTitle = "Ready",
  emptyHint,
  exampleTasks = [],
  className = "",
  hideToolLog = false,
  variant = "drawer",
  accentColor = "#94a3b8",
  conversationId = null,
  bindings,
}: Props & { bindings: AgentChatBindings }) {
  const isWorkspace = variant === "workspace";
  const bubbleMax = isWorkspace
    ? "max-w-full"
    : variant === "center"
      ? "max-w-[90%]"
      : "max-w-[85%]";
  const [input, setInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPinnedToBottom, setIsPinnedToBottom] = useState(true);
  const { messages, toolEvents, sendMessage, isThinking, clearHistory, hydrated } =
    bindings;
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevMessageCountRef = useRef(0);
  const wasThinkingRef = useRef(false);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "auto") => {
    scrollContainerRef.current?.scrollTo({
      top: scrollContainerRef.current.scrollHeight,
      behavior,
    });
  }, []);

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setIsPinnedToBottom(
      el.scrollHeight - el.scrollTop - el.clientHeight < PIN_THRESHOLD_PX,
    );
  }, []);

  useEffect(() => {
    const userJustSent = messages.length > prevMessageCountRef.current && !isThinking;
    const streamJustEnded = wasThinkingRef.current && !isThinking;
    if (isPinnedToBottom || userJustSent) {
      scrollToBottom(userJustSent || streamJustEnded ? "smooth" : "auto");
    }
    prevMessageCountRef.current = messages.length;
    wasThinkingRef.current = isThinking;
  }, [messages, isThinking, isPinnedToBottom, scrollToBottom]);

  const handleSend = async () => {
    if ((!input.trim() && !selectedFile) || isThinking) return;
    const msg = input;
    const file = selectedFile;
    setInput("");
    setSelectedFile(null);
    setIsPinnedToBottom(true);
    await sendMessage(msg || "Please process this file.", file ? { file } : undefined);
  };

  const isCSV = selectedFile?.name.toLowerCase().endsWith(".csv");

  if (!hydrated) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <p className="text-sm text-[#94a3b8]">Loading conversation…</p>
      </div>
    );
  }

  const sessionId = conversationId ?? bindings.conversationId;

  return (
    <div className={`flex flex-col h-full min-h-0 ${className}`}>
      <div
        className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-white/[0.06] shrink-0"
        style={isWorkspace ? { borderTopColor: `${accentColor}33` } : undefined}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div
            className="w-2 h-2 rounded-full shrink-0 animate-pulse"
            style={{ backgroundColor: accentColor }}
          />
          <span className="text-[10px] sm:text-xs font-mono text-[#94a3b8] truncate">
            {headerLabel}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {isWorkspace && (
            <button
              type="button"
              disabled
              title="Coming soon"
              className="text-[10px] text-[#64748b] px-2 py-1 rounded-md border border-white/10 opacity-50 cursor-not-allowed"
            >
              New chat
            </button>
          )}
          <button
            type="button"
            onClick={clearHistory}
            className="text-xs text-[#64748b] hover:text-[#e2e8f0] px-2.5 py-1.5 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10"
          >
            Clear
          </button>
        </div>
      </div>
      {isWorkspace && sessionId && (
        <p className="text-[10px] font-mono text-[#64748b] px-4 py-1 border-b border-white/[0.04] shrink-0 truncate">
          session · {sessionId.slice(0, 12)}…
        </p>
      )}

      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className={`flex-grow overflow-y-auto space-y-3 min-h-0 ${isWorkspace ? "p-4 lg:p-5" : "p-4"}`}
      >
        {messages.length === 0 && !isThinking && (
          <div className="flex flex-col items-center text-center gap-4 py-6">
            <p className="font-semibold text-[#e2e8f0]">{emptyTitle}</p>
            {emptyHint && (
              <p className="text-sm text-[#94a3b8] max-w-sm">{emptyHint}</p>
            )}
            {exampleTasks.length > 0 && (
              <div className="flex flex-col gap-2 w-full max-w-md">
                {exampleTasks.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setInput(t)}
                    className="text-left text-xs px-3 py-2 rounded-lg border border-white/10 hover:border-white/20 text-[#94a3b8] hover:text-[#e2e8f0] transition"
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`${bubbleMax} rounded-2xl px-4 py-3 ${
                msg.sender === "user"
                  ? isWorkspace
                    ? "text-[#0a0b0f] rounded-tr-sm"
                    : "gradient-rachax text-white rounded-tr-sm"
                  : "glass-light border border-white/10 rounded-tl-sm"
              }`}
              style={
                msg.sender === "user" && isWorkspace
                  ? { backgroundColor: accentColor }
                  : undefined
              }
            >
              {msg.sender === "agent" ? (
                <AgentMarkdown content={msg.text || "…"} />
              ) : (
                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
              )}
            </div>
          </div>
        ))}

        {isThinking && messages[messages.length - 1]?.sender !== "agent" && (
          <div className="flex justify-start">
            <div className="glass-light rounded-2xl px-4 py-3 flex items-center gap-2 border border-white/10">
              <span className="text-sm italic text-[#94a3b8]">Reasoning…</span>
              <div className="flex gap-0.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full animate-bounce"
                    style={{
                      backgroundColor: accentColor,
                      animationDelay: `${i * 0.15}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-white/5 p-3 space-y-2 glass-light shrink-0">
        {!selectedFile ? (
          <div
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const f = e.dataTransfer.files?.[0];
              if (f) setSelectedFile(f);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`p-2 rounded-xl border border-dashed text-xs text-center cursor-pointer ${
              isDragging ? "border-[#00d4aa] text-[#00d4aa]" : "border-white/15 text-[#64748b]"
            }`}
          >
            Drop CSV or file · or type CID
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 text-xs">
            <span className="truncate flex-1 text-[#e2e8f0]">{selectedFile.name}</span>
            <button type="button" onClick={() => setSelectedFile(null)}>
              ✕
            </button>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) setSelectedFile(f);
            e.target.value = "";
          }}
        />
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            disabled={isThinking}
            placeholder={placeholder}
            className={
              isWorkspace
                ? "flex-grow p-3 rounded-xl glass border border-white/10 text-sm bg-white/[0.02] focus:outline-none focus:ring-1 focus:ring-[color:var(--chat-accent)]"
                : "flex-grow p-3 rounded-xl glass border border-white/10 text-sm bg-white/[0.02] focus:outline-none focus:ring-1 focus:ring-[#8b5cf6]/50"
            }
            style={
              isWorkspace ? ({ "--chat-accent": accentColor } as React.CSSProperties) : undefined
            }
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={isThinking || (!input.trim() && !selectedFile)}
            className={
              isWorkspace
                ? "px-5 py-3 rounded-xl font-semibold text-sm text-[#0a0b0f] disabled:opacity-40"
                : "px-5 py-3 rounded-xl font-semibold text-sm gradient-rachax text-white disabled:opacity-40"
            }
            style={isWorkspace ? { backgroundColor: accentColor } : undefined}
          >
            {isThinking ? "…" : "Send"}
          </button>
        </div>
      </div>
      {!hideToolLog && <ToolLog events={toolEvents} agentSlug={agentSlug} />}
    </div>
  );
}
