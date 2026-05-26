import type { SDGAgent } from "./types";
import { SDG_SEEDS } from "./sdg-seeds";
import { getUnSdgMeta } from "./un-sdg-meta";

function slugFor(n: number) {
  return `sdg-${String(n).padStart(2, "0")}`;
}

function buildPromptBlock(agent: SDGAgent): string {
  return `## SDG ${agent.number} Persona — ${agent.name} (${agent.role})
Official goal: ${agent.sdgTitle}.

Mission context: ${agent.description}

Before answering factual questions:
1. Call \`web_search\` at most twice per user message (do not rephrase the same query). Prefer sources: ${agent.dataSources.join(", ")}.
2. Read the tool JSON: if \`ok\` is false or \`results\` is empty, say live search returned nothing — cite these catalog sources by name and ask for CSV/upload. Never imply search succeeded when it did not.
3. When \`ok\` is true, cite \`results[].url\` with year from snippets. Refuse generic answers without data.
4. Use \`stageCsvForAnalysis\` for user tabular uploads; Storacha store/retrieve for evidence; ERC-8004 + x402 for paid services.

Example tasks for this agent:
${agent.exampleTasks.map((t) => `- ${t}`).join("\n")}`;
}

export const SDG_AGENTS: SDGAgent[] = SDG_SEEDS.map((seed) => {
  const slug = slugFor(seed.number);
  const agent: SDGAgent = {
    slug,
    number: seed.number,
    name: seed.name,
    role: seed.role,
    sdgTitle: seed.sdgTitle,
    accentColor: seed.accentColor,
    iconPath: `/sdg/goal-${String(seed.number).padStart(2, "0")}.svg`,
    description: seed.description,
    systems: seed.systems,
    tools: seed.tools,
    dataSources: seed.dataSources,
    exampleTasks: seed.exampleTasks,
    connectionBadges: seed.connectionBadges,
    systemPromptBlock: "",
    unMeta: getUnSdgMeta(seed.number),
  };
  agent.systemPromptBlock = buildPromptBlock(agent);
  return agent;
});

export const SDG_BY_SLUG = Object.fromEntries(SDG_AGENTS.map((a) => [a.slug, a])) as Record<
  string,
  SDGAgent
>;
