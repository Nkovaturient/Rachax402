import { prisma } from "@/lib/prisma.client";
import type { ModelMessage } from "ai";

const MAX_HISTORY_MESSAGES = 40;

export async function getOrCreateConversation(userId: string, conversationId?: string) {
  if (conversationId) {
    const existing = await prisma.conversation.findFirst({
      where: { id: conversationId, userId },
    });
    if (existing) return existing;
  }

  const latest = await prisma.conversation.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
  if (latest) return latest;

  return prisma.conversation.create({
    data: { userId },
  });
}

export async function loadModelMessages(conversationId: string): Promise<ModelMessage[]> {
  const rows = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    take: MAX_HISTORY_MESSAGES,
  });

  return rows.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));
}

export async function persistUserMessage(conversationId: string, content: string) {
  await prisma.$transaction([
    prisma.message.create({
      data: { conversationId, role: "user", content },
    }),
    prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    }),
  ]);
}

export async function persistAssistantMessage(conversationId: string, content: string) {
  if (!content.trim()) return;
  await prisma.$transaction([
    prisma.message.create({
      data: { conversationId, role: "assistant", content },
    }),
    prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    }),
  ]);
}
