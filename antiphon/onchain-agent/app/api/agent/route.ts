/**
 * route.ts — Rachax402 AgentKit API Route
 *
 * Uses streamText so tool execution events keep the HTTP connection alive,
 * preventing browser/Vercel timeouts during 2-3 min agent pipelines.
 *
 * BUG FIXED (AI_InvalidPromptError: messages must not be empty):
 *   historyWithoutBlobs was built from `messages` BEFORE the new user message
 *   was pushed. On the first turn messages=[] → streamText received zero
 *   messages → crash. Fix: push first, then snapshot with blob-stripping.
 */

import { NextResponse } from "next/server";
import { createAgent } from "./create-agent";
import { ModelMessage, streamText, stepCountIs } from "ai";
import { setPendingFile, clearPendingFile } from "./file-context";
import { getSessionUser } from "@/lib/auth/get-session-user";
import {
  getOrCreateConversation,
  loadModelMessages,
  persistUserMessage,
  persistAssistantMessage,
} from "@/lib/conversations";

export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contentType = req.headers.get("content-type") || "";
    let userMessage = "";
    let conversationId: string | undefined;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const textInput = (formData.get("message") as string) || "";
      const file = formData.get("file") as File | null;
      conversationId = (formData.get("conversationId") as string) || undefined;

      userMessage = textInput;

      if (file && file.size > 0) {
        const arrayBuffer = await file.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");
        const isCSV =
          file.name.toLowerCase().endsWith(".csv") || file.type === "text/csv";
        const mimeType = file.type || "application/octet-stream";

        setPendingFile({
          base64,
          filename: file.name,
          mimeType,
          sizeBytes: file.size,
        });

        userMessage +=
          (userMessage ? "\n\n" : "") +
          `[File attached: "${file.name}" (${(file.size / 1024).toFixed(1)} KB, ${mimeType})]` +
          (isCSV
            ? "\nPlease analyze this CSV file. Call stageCsvForAnalysis with the filename above."
            : "\nPlease store this file on Storacha. Call paidStoreFile with the filename above.");
      }
    } else {
      const body = await req.json();
      userMessage = body.userMessage || body.message || "";
      conversationId = body.conversationId;
    }

    if (!userMessage.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const conversation = await getOrCreateConversation(
      session.dbUser.id,
      conversationId,
    );

    await persistUserMessage(conversation.id, userMessage);

    const historyForModel: ModelMessage[] = await loadModelMessages(
      conversation.id,
    );

    const agent = await createAgent();

    let assistantText = "";

    const result = streamText({
      model: agent.model,
      system: agent.system,
      tools: agent.tools as any,
      messages: historyForModel,
      stopWhen: stepCountIs(agent.maxSteps),
    });

    const encoder = new TextEncoder();
    let controllerClosed = false;

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const enqueue = (data: string) => {
          if (controllerClosed) return;
          try {
            controller.enqueue(encoder.encode(data));
          } catch {
            controllerClosed = true;
          }
        };

        const heartbeat = setInterval(() => enqueue("h:\n"), 4000);

        try {
          const t0 = Date.now();
          for await (const part of (result as { fullStream: AsyncIterable<{ type: string }> }).fullStream) {
            if (controllerClosed) break;
            const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

            if (part.type === "text-delta") {
              const td =
                (part as { textDelta?: string; delta?: string; text?: string }).textDelta ??
                (part as { delta?: string }).delta ??
                (part as { text?: string }).text;
              if (td) {
                assistantText += td;
                enqueue(`0:${JSON.stringify(td)}\n`);
              }
            } else if (part.type === "tool-input-start") {
              const name = (part as { toolName?: string }).toolName ?? "tool";
              console.log(`[AgentA +${elapsed}s] → tool: ${name}`);
              enqueue(`b:${JSON.stringify({ toolName: name })}\n`);
            } else if (part.type === "tool-call") {
              const name = (part as { toolName?: string }).toolName ?? "tool";
              console.log(`[AgentA +${elapsed}s] ▶ tool-call: ${name}`);
            } else if (part.type === "tool-result") {
              const output =
                (part as { output?: unknown; result?: unknown }).output ??
                (part as { result?: unknown }).result;
              const name = (part as { toolName?: string }).toolName ?? "tool";
              const snippet =
                typeof output === "string"
                  ? output.slice(0, 120)
                  : JSON.stringify(output).slice(0, 120);
              console.log(`[AgentA +${elapsed}s] ← ${name}: ${snippet}`);
              enqueue(`a:${JSON.stringify({ toolName: name, result: output })}\n`);
            } else if (part.type === "error") {
              console.error(`[AgentA +${elapsed}s] error:`, (part as { error?: unknown }).error);
            } else if (!["tool-input-delta", "source"].includes(part.type)) {
              console.log(`[AgentA +${elapsed}s] ${part.type}`);
            }
          }
          console.log(`[AgentA] stream done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);

          const final = assistantText.trim();
          if (final) {
            await persistAssistantMessage(conversation.id, final);
          }
        } catch (err) {
          console.error("[AgentA] stream error:", err);
        } finally {
          clearInterval(heartbeat);
          clearPendingFile();
          if (!controllerClosed) {
            controllerClosed = true;
            controller.close();
          }
        }
      },
      cancel() {
        controllerClosed = true;
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Conversation-Id": conversation.id,
      },
    });
  } catch (error) {
    console.error("[AgentA] Route error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "AgentA encountered an error. Check Anthropic API key and CDP credentials.",
      },
      { status: 500 },
    );
  }
}
