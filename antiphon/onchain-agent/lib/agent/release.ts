import { createHash } from "crypto";
import { prisma } from "@/lib/prisma.client";
import { STATIC_AGENT_SLUGS } from "@/lib/data/registry";

// Model IDs keyed by agent class — single source of truth alongside create-agent.ts
export const DEFAULT_MODEL_IDS: Record<string, string> = {
  agenta: "claude-sonnet-4-6",
};
// All SDG slugs map to DeepSeek
for (const slug of STATIC_AGENT_SLUGS) {
  if (slug !== "agenta") DEFAULT_MODEL_IDS[slug] = "deepseek-chat";
}

export function hashPrompt(system: string): string {
  return createHash("sha256").update(system).digest("hex").slice(0, 16);
}

export async function resolveRelease(
  agentSlug: string,
): Promise<{ id: string; modelId: string; version: number }> {
  const active = await prisma.agentRelease.findFirst({
    where: { agentSlug, isActive: true },
    select: { id: true, modelId: true, version: true },
  });
  if (active) return active;

  // Auto-seed v1 on first request
  const modelId = DEFAULT_MODEL_IDS[agentSlug] ?? "deepseek-chat";
  const release = await prisma.agentRelease.upsert({
    where: { agentSlug_version: { agentSlug, version: 1 } },
    create: {
      agentSlug,
      version: 1,
      modelId,
      promptHash: "seed",
      isActive: true,
    },
    update: { isActive: true },
    select: { id: true, modelId: true, version: true },
  });
  return release;
}

export async function updatePromptHash(
  releaseId: string,
  system: string,
): Promise<void> {
  const hash = hashPrompt(system);
  await prisma.agentRelease.update({
    where: { id: releaseId },
    data: { promptHash: hash },
  });
}

export async function setActiveRelease(
  agentSlug: string,
  version: number,
): Promise<{ id: string; modelId: string; version: number }> {
  const target = await prisma.agentRelease.findUniqueOrThrow({
    where: { agentSlug_version: { agentSlug, version } },
  });

  await prisma.$transaction([
    prisma.agentRelease.updateMany({
      where: { agentSlug, isActive: true },
      data: { isActive: false },
    }),
    prisma.agentRelease.update({
      where: { id: target.id },
      data: { isActive: true },
    }),
  ]);

  return { id: target.id, modelId: target.modelId, version: target.version };
}

export async function listReleases(agentSlug: string) {
  return prisma.agentRelease.findMany({
    where: { agentSlug },
    orderBy: { version: "desc" },
    select: { id: true, version: true, modelId: true, promptHash: true, isActive: true, createdAt: true },
  });
}
