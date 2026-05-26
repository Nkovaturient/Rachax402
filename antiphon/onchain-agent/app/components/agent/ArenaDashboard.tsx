"use client";

import type { SDGAgent } from "@/lib/data/types";
import { AgentArenaWorkspace } from "./AgentArenaWorkspace";

export function ArenaDashboard({ agent }: { agent: SDGAgent }) {
  return <AgentArenaWorkspace agent={agent} />;
}
