/**
 * useAgent.ts — Rachax402 AgentKit React Hook
 *
 * Chain selection is server-side only: set onchain-agent .env NETWORK_ID to
 * `base-sepolia` or `base-mainnet` (and matching RPC_URL / ERC8004_*), same as AgentB
 * X402_NETWORK + CDP facilitator. This hook only streams /api/agent.
 *
 * Reads the text/plain stream from route.ts and reassembles:
 *   0:"<delta>"\n  → text chunks accumulated into the agent message
 *   a:{...}\n      → tool result appended to the live toolCalls log
 *
 * Streams /api/agent with conversation persistence and throttled UI updates.
 */

import { useState, useRef, useCallback, useEffect } from "react";
import type { ToolEvent } from "../components/ToolLog";

export interface AgentMessage {
  text: string;
  sender: "user" | "agent";
  timestamp: number;
}

export interface SendMessageOptions {
  file?: File;
}

const STREAM_THROTTLE_MS = 50;

export function useAgent() {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [toolEvents, setToolEvents] = useState<ToolEvent[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const streamingIndexRef = useRef<number | null>(null);
  const pendingTextRef = useRef("");
  const throttleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushPendingText = useCallback((agentMsgIndex: number) => {
    const text = pendingTextRef.current;
    setMessages((prev) =>
      prev.map((m, i) => (i === agentMsgIndex ? { ...m, text } : m)),
    );
  }, []);

  const scheduleTextFlush = useCallback(
    (agentMsgIndex: number) => {
      if (throttleTimerRef.current) return;
      throttleTimerRef.current = setTimeout(() => {
        throttleTimerRef.current = null;
        flushPendingText(agentMsgIndex);
      }, STREAM_THROTTLE_MS);
    },
    [flushPendingText],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/conversations/current");
        if (!res.ok) return;
        const data = (await res.json()) as {
          conversationId: string;
          messages: { role: string; content: string; createdAt: string }[];
        };
        if (cancelled) return;
        setConversationId(data.conversationId);
        setMessages(
          data.messages.map((m) => ({
            text: m.content,
            sender: m.role === "user" ? "user" : "agent",
            timestamp: new Date(m.createdAt).getTime(),
          })),
        );
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const sendMessage = async (input: string, options?: SendMessageOptions) => {
    if (!input.trim() && !options?.file) return;

    const displayText = options?.file
      ? `${input || "Process this file:"} [${options.file.name}]`
      : input;

    setMessages((prev) => [
      ...prev,
      { text: displayText, sender: "user", timestamp: Date.now() },
    ]);
    setIsThinking(true);

    const agentMsgIndex = await new Promise<number>((resolve) => {
      setMessages((prev) => {
        const idx = prev.length;
        streamingIndexRef.current = idx;
        resolve(idx);
        return [...prev, { text: "", sender: "agent", timestamp: Date.now() }];
      });
    });

    pendingTextRef.current = "";

    try {
      let body: BodyInit;
      const headers: HeadersInit = {};

      if (options?.file) {
        const formData = new FormData();
        formData.append("message", input);
        formData.append("file", options.file);
        if (conversationId) formData.append("conversationId", conversationId);
        body = formData;
      } else {
        body = JSON.stringify({
          userMessage: input,
          conversationId: conversationId ?? undefined,
        });
        headers["Content-Type"] = "application/json";
      }

      const res = await fetch("/api/agent", { method: "POST", headers, body });

      if (!res.ok || !res.body) {
        const errText = await res.text().catch(() => "Unknown error");
        setMessages((prev) =>
          prev.map((m, i) =>
            i === agentMsgIndex ? { ...m, text: `Error: ${errText}` } : m,
          ),
        );
        return;
      }

      const convHeader = res.headers.get("X-Conversation-Id");
      if (convHeader) setConversationId(convHeader);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;

          if (line.startsWith("0:")) {
            try {
              const delta: string = JSON.parse(line.slice(2));
              accText += delta;
              pendingTextRef.current = accText;
              scheduleTextFlush(agentMsgIndex);
            } catch {
              /* ignore */
            }
          } else if (line.startsWith("b:")) {
            try {
              const payload = JSON.parse(line.slice(2));
              const name = payload.toolName ?? "tool";
              setToolEvents((prev) => [
                ...prev,
                { tool: name, status: "pending", result: "", timestamp: Date.now() },
              ]);
            } catch {
              /* ignore */
            }
          } else if (line.startsWith("a:")) {
            try {
              const payload = JSON.parse(line.slice(2));
              const name = payload.toolName ?? "tool";
              const resultText =
                typeof payload.result === "string"
                  ? payload.result
                  : JSON.stringify(payload.result);
              setToolEvents((prev) => {
                const updated = [...prev];
                const idx = [...updated]
                  .reverse()
                  .findIndex((e) => e.tool === name && e.status === "pending");
                if (idx !== -1) {
                  updated[updated.length - 1 - idx] = {
                    ...updated[updated.length - 1 - idx],
                    status: "done",
                    result: resultText,
                  };
                } else {
                  updated.push({
                    tool: name,
                    status: "done",
                    result: resultText,
                    timestamp: Date.now(),
                  });
                }
                return updated;
              });
            } catch {
              /* ignore */
            }
          }
        }
      }

      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current);
        throttleTimerRef.current = null;
      }
      const finalText = accText.trim() || "No response.";
      pendingTextRef.current = finalText;
      setMessages((prev) =>
        prev.map((m, i) => (i === agentMsgIndex ? { ...m, text: finalText } : m)),
      );
    } catch (err) {
      console.error("[useAgent] fetch error:", err);
      setMessages((prev) =>
        prev.map((m, i) =>
          i === agentMsgIndex
            ? { ...m, text: "Could not reach AgentA. Is the server running?" }
            : m,
        ),
      );
    } finally {
      setIsThinking(false);
      streamingIndexRef.current = null;
    }
  };

  const clearHistory = async () => {
    try {
      const res = await fetch("/api/conversations/current", { method: "DELETE" });
      if (res.ok) {
        const data = (await res.json()) as { conversationId: string };
        setConversationId(data.conversationId);
      }
    } catch {
      /* ignore */
    }
    setMessages([]);
    setToolEvents([]);
  };

  return {
    messages,
    toolEvents,
    sendMessage,
    isThinking,
    clearHistory,
    conversationId,
    hydrated,
  };
}
