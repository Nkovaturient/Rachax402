import { AGENTA_SLUG, agentaConfig } from "./agenta";
import { SDG_AGENTS, SDG_BY_SLUG } from "./sdg-agents";
import type { SDGAgent } from "./types";

export const STATIC_AGENT_SLUGS = [AGENTA_SLUG, ...SDG_AGENTS.map((a) => a.slug)] as const;

export type AgentSlug = (typeof STATIC_AGENT_SLUGS)[number];

export function isValidAgentSlug(slug: string): slug is AgentSlug {
  return slug === AGENTA_SLUG || slug in SDG_BY_SLUG;
}

export function isSdgSlug(slug: string): boolean {
  return slug in SDG_BY_SLUG;
}

export function isAgentaSlug(slug: string): boolean {
  return slug === AGENTA_SLUG;
}

export function getSdgAgent(slug: string): SDGAgent | undefined {
  return SDG_BY_SLUG[slug];
}

export function getSystemPromptBlock(agentSlug?: string): string {
  if (!agentSlug || agentSlug === AGENTA_SLUG) return agentaConfig.systemPromptBlock;
  return SDG_BY_SLUG[agentSlug]?.systemPromptBlock ?? "";
}

export function getAgentDisplayName(agentSlug?: string): string {
  if (!agentSlug || agentSlug === AGENTA_SLUG) return agentaConfig.name;
  return SDG_BY_SLUG[agentSlug]?.name ?? "Agent";
}

export { SDG_AGENTS, agentaConfig, AGENTA_SLUG };
