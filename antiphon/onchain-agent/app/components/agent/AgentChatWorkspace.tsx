"use client";

import Link from "next/link";
import type { SDGAgent } from "@/lib/data/types";
import type { AgentChatBindings } from "@/app/hooks/useAgent";
import { AgentChatPanel } from "./AgentChatPanel";
import { RuntimeLogPanel } from "./RuntimeLogPanel";

export type ChatWorkspaceConfig = {
  accentColor: string;
  agentSlug: string;
  name: string;
  sdgTitle: string;
  description: string;
  exampleTasks?: string[];
  headerLabel: string;
  placeholder: string;
  emptyTitle: string;
};

type Props = {
  config: ChatWorkspaceConfig;
  agentBindings: AgentChatBindings;
  authed: boolean | null;
  loginHref: string;
};

export function AgentChatWorkspace({
  config,
  agentBindings,
  authed,
  loginHref,
}: Props) {
  const {
    accentColor,
    agentSlug,
    name,
    sdgTitle,
    description,
    exampleTasks = [],
    headerLabel,
    placeholder,
    emptyTitle,
  } = config;

  return (
    <div className="flex flex-col lg:flex-row gap-3 h-full min-h-0 flex-1">
      <div className="flex flex-col min-h-[280px] lg:min-h-0 lg:w-[60%] lg:shrink-0 flex-1 lg:flex-none glass rounded-2xl border border-white/[0.06] overflow-hidden">
        {authed === null ? (
          <div className="flex-grow flex items-center justify-center text-sm text-[#94a3b8]">
            Checking session…
          </div>
        ) : authed ? (
          <AgentChatPanel
            agentSlug={agentSlug}
            agentBindings={agentBindings}
            headerLabel={headerLabel}
            placeholder={placeholder}
            emptyTitle={emptyTitle}
            emptyHint={description}
            exampleTasks={exampleTasks}
            hideToolLog
            variant="workspace"
            accentColor={accentColor}
            conversationId={agentBindings.conversationId}
            className="flex-grow min-h-0 h-full"
          />
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center gap-4 p-8 text-center">
            <p className="text-[#94a3b8] text-sm">
              Sign in to chat with {name} and run on-chain tools.
            </p>
            <Link
              href={loginHref}
              className="px-6 py-3 rounded-full text-sm font-bold"
              style={{ backgroundColor: accentColor, color: "#0a0b0f" }}
            >
              Sign in
            </Link>
          </div>
        )}
      </div>

      <div className="flex flex-col min-h-[220px] lg:min-h-0 lg:w-[40%] flex-1 lg:flex-none">
        <RuntimeLogPanel
          events={agentBindings.toolEvents}
          agentSlug={agentSlug}
          accentColor={accentColor}
        />
      </div>
    </div>
  );
}

export function sdgToChatConfig(agent: SDGAgent): ChatWorkspaceConfig {
  return {
    accentColor: agent.accentColor,
    agentSlug: agent.slug,
    name: agent.name,
    sdgTitle: agent.sdgTitle,
    description: agent.description,
    exampleTasks: agent.exampleTasks,
    headerLabel: `${agent.name} · ERC-8004 · x402 · Storacha`,
    placeholder: `Ask ${agent.name} about ${agent.sdgTitle}…`,
    emptyTitle: `${agent.name} is ready`,
  };
}
