import type { SDGAgent } from "./types";
import { SDG_SEEDS } from "./sdg-seeds";
import { getUnSdgMeta } from "./un-sdg-meta";
import { getSdgWorkflow, SHARED_WORKFLOW_TEMPLATE } from "@/lib/sdg/workflows";

function slugFor(n: number) {
  return `sdg-${String(n).padStart(2, "0")}`;
}

function buildPromptBlock(agent: SDGAgent): string {
  const wf = getSdgWorkflow(agent.slug);
  const steps = wf?.workflowSteps ?? [];
  const actors = wf?.humanActors ?? [];

  return `## SDG ${agent.number} — ${agent.name} (${agent.role})
Goal: ${agent.sdgTitle}
Mission: ${agent.description}

Workflow: ${SHARED_WORKFLOW_TEMPLATE.join(" → ")}
${steps.length > 0 ? `Example steps for ${agent.name}:\n${steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}` : ""}

Sources: ${agent.dataSources.join(", ")}
${actors.length > 0 ? `Human actors: ${actors.join(", ")}` : ""}

Rules:
- Max 2  search_verified_evidence calls per user turn; do not rephrase the same query
- After every tool call, read the JSON: if ok:false, use error_category to decide next action (never blind retry on permission or system_error)
- Always cite result URLs; never invent statistics
- If search returns nothing, say so and ask for CSV upload or human direction
- Brief sections (compose_action_brief): Findings | Citations | Limits | Actors | Verify

Example tasks:
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
