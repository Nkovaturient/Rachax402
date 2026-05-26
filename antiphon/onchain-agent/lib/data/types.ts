export interface ArenaMetric {
  label: string;
  value: string;
  unit?: string;
  trend?: string;
}

export interface ArenaTool {
  label: string;
  description: string;
  capability: string;
}

import type { UnSdgMeta } from "./un-sdg-meta";

export type { UnSdgMeta };

export interface SDGAgent {
  slug: string;
  number: number;
  name: string;
  role: string;
  sdgTitle: string;
  accentColor: string;
  iconPath: string;
  description: string;
  systems: ArenaMetric[];
  tools: ArenaTool[];
  dataSources: string[];
  exampleTasks: string[];
  connectionBadges: string[];
  systemPromptBlock: string;
  unMeta?: UnSdgMeta;
}

export interface AgentaConfig {
  slug: "agenta";
  name: string;
  role: string;
  description: string;
  systemPromptBlock: string;
}
