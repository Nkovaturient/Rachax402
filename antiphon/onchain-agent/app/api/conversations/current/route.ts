import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/get-session-user";
import { getOrCreateConversation } from "@/lib/conversations";
import { prisma } from "@/lib/prisma.client";
import { AGENTA_SLUG } from "@/lib/data/registry";

export async function GET(req: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const agentSlug = searchParams.get("agentSlug") || AGENTA_SLUG;

  const conversation = await getOrCreateConversation(
    session.dbUser.id,
    agentSlug,
  );
  const messages = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "asc" },
    take: 40,
  });

  return NextResponse.json({
    conversationId: conversation.id,
    agentSlug: conversation.agentSlug,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    })),
  });
}

export async function DELETE(req: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const agentSlug = searchParams.get("agentSlug") || AGENTA_SLUG;

  const conversation = await prisma.conversation.create({
    data: { userId: session.dbUser.id, agentSlug },
  });

  return NextResponse.json({
    conversationId: conversation.id,
    agentSlug: conversation.agentSlug,
  });
}
