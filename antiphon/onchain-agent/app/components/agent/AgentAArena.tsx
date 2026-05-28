"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AgentChatWorkspace, type ChatWorkspaceConfig } from "./AgentChatWorkspace";
import { useAgent } from "@/app/hooks/useAgent";
import { AGENTA_SLUG, agentaConfig } from "@/lib/data/registry";

const AGENTA_ACCENT = "#dfff00";

const agentaChatConfig: ChatWorkspaceConfig = {
  accentColor: AGENTA_ACCENT,
  agentSlug: AGENTA_SLUG,
  name: agentaConfig.name,
  sdgTitle: "Orchestrator",
  description: agentaConfig.description,
  exampleTasks: [],
  headerLabel: "AgentA · ERC-8004 · x402 · Storacha · Base",
  placeholder: "Ask AgentA to analyze, store, or retrieve…",
  emptyTitle: "AgentA is ready",
};

export function AgentAArena() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const agentBindings = useAgent(AGENTA_SLUG);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setAuthed(!!data.user));
  }, []);

  return (
    <div className="w-full max-w-[min(1400px,96vw)] mx-auto px-4 sm:px-6 py-4 flex flex-col h-[calc(100vh-5.5rem)] min-h-0">
      <div className="mb-3 flex items-center justify-between gap-2 shrink-0">
        <div>
          <p className="label-caps text-muted">Orchestrator</p>
          <h1 className="font-display text-lg font-bold text-primary">{agentaConfig.name}</h1>
          <p className="text-xs text-secondary">{agentaConfig.role}</p>
        </div>
        <Link
          href="/marketplace"
          className="text-xs font-semibold tracking-wide px-4 py-2.5 rounded-xl glass-liquid accent-rim text-neon hover:brightness-110 shrink-0 arena-nav-btn"
          style={{ ["--agent-accent" as string]: AGENTA_ACCENT }}
        >
          ← SDG agents
        </Link>
      </div>

      <div className="flex flex-col flex-1 min-h-0">
        <AgentChatWorkspace
          config={agentaChatConfig}
          agentBindings={agentBindings}
          authed={authed}
          loginHref="/login?next=/agent/agenta"
        />
      </div>
    </div>
  );
}
