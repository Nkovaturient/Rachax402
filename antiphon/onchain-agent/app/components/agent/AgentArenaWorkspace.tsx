"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { SDGAgent } from "@/lib/data/types";
import { useAgent } from "@/app/hooks/useAgent";
import { AgentChatWorkspace, sdgToChatConfig } from "./AgentChatWorkspace";
import { ArenaHeaderBand } from "./arena/ArenaHeaderBand";
import { ArenaKpiRow } from "./arena/ArenaKpiRow";
import { ArenaCenterHero } from "./arena/ArenaCenterHero";
import { ArenaSystemsColumn } from "./arena/ArenaSystemsColumn";
import { ArenaToolsColumn } from "./arena/ArenaToolsColumn";

type Mode = "dashboard" | "workspace";

function ArenaNavButtons({
  agent,
  mode,
  onOverview,
}: {
  agent: SDGAgent;
  mode: Mode;
  onOverview: () => void;
}) {
  return (
    <nav
      className="flex w-full items-center justify-between gap-4 mb-4 shrink-0 arena-nav-btn"
      style={{ ["--agent-accent" as string]: agent.accentColor }}
      aria-label="Arena navigation"
    >
      <Link
        href="/marketplace"
        className="group inline-flex items-center gap-2 text-xs font-semibold tracking-wide px-4 py-2.5 rounded-xl glass-liquid accent-rim text-primary transition hover:brightness-110"
      >
        <span
          className="inline-flex w-6 h-6 items-center justify-center rounded-md text-[10px] arena-nav-chip transition group-hover:scale-105"
          aria-hidden
        >
          ←
        </span>
        Marketplace
      </Link>

      {mode === "workspace" ? (
        <button
          type="button"
          onClick={onOverview}
          className="group inline-flex items-center gap-2 text-xs font-semibold tracking-wide px-4 py-2.5 rounded-xl glass-liquid accent-rim text-primary transition hover:brightness-110"
        >
          Overview
          <span
            className="inline-flex w-6 h-6 items-center justify-center rounded-md text-[10px] arena-nav-chip transition group-hover:scale-105"
            aria-hidden
          >
            →
          </span>
        </button>
      ) : (
        <span className="w-px h-9 opacity-0 pointer-events-none" aria-hidden />
      )}
    </nav>
  );
}

function WorkspaceCompactHeader({ agent }: { agent: SDGAgent }) {
  return (
    <div className="shrink-0 mb-3">
      <p className="label-caps text-muted mb-0.5">SDG {String(agent.number).padStart(2, "0")}</p>
      <h1 className="font-display text-lg font-bold text-primary truncate">
        {agent.name}
        <span className="text-muted font-normal"> · {agent.role}</span>
      </h1>
    </div>
  );
}

export function AgentArenaWorkspace({ agent }: { agent: SDGAgent }) {
  const searchParams = useSearchParams();
  const chatParam = searchParams.get("chat");
  const [mode, setMode] = useState<Mode>(chatParam === "1" ? "workspace" : "dashboard");
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    if (chatParam === "1") setMode("workspace");
  }, [chatParam]);

  useEffect(() => {
    if (mode !== "workspace") return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setAuthed(!!data.user));
  }, [mode]);

  const loginHref = `/login?next=${encodeURIComponent(`/agent/${agent.slug}?chat=1`)}`;

  const openWorkspace = () => {
    setMode("workspace");
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const ok = !!data.user;
      setAuthed(ok);
      if (!ok) window.location.href = loginHref;
    });
  };

  const isWorkspace = mode === "workspace";

  return (
    <div
      className={`w-full mx-auto px-4 sm:px-6 flex flex-col min-h-0 ${
        isWorkspace
          ? "max-w-[min(1400px,96vw)] h-[calc(100vh-5.5rem)] py-4"
          : "max-w-6xl py-8"
      }`}
      style={{ ["--agent-accent" as string]: agent.accentColor }}
    >
      {isWorkspace ? (
        <WorkspaceCompactHeader agent={agent} />
      ) : (
        <ArenaHeaderBand agent={agent} />
      )}

      <ArenaNavButtons agent={agent} mode={mode} onOverview={() => setMode("dashboard")} />

      {mode === "dashboard" ? (
        <>
          <ArenaKpiRow agent={agent} />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[420px]">
            <ArenaSystemsColumn agent={agent} />
            <div className="lg:col-span-6">
              <ArenaCenterHero agent={agent} />
            </div>
            <ArenaToolsColumn agent={agent} />
          </div>
          <div className="mt-10 flex flex-col items-center gap-4">
            <button
              type="button"
              onClick={openWorkspace}
              className="px-8 py-4 rounded-full text-sm font-bold glass-liquid accent-rim accent-rim-hover text-primary transition w-full sm:w-auto max-w-md"
            >
              Let&apos;s Get Down to Solving This
            </button>
            <p className="text-xs text-muted text-center max-w-lg">
              Data sources: {agent.dataSources.join(" · ")}
            </p>
          </div>
        </>
      ) : (
        <ArenaWorkspacePane agent={agent} authed={authed} loginHref={loginHref} />
      )}
    </div>
  );
}

function ArenaWorkspacePane({
  agent,
  authed,
  loginHref,
}: {
  agent: SDGAgent;
  authed: boolean | null;
  loginHref: string;
}) {
  const agentBindings = useAgent(agent.slug);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <AgentChatWorkspace
        config={sdgToChatConfig(agent)}
        agentBindings={agentBindings}
        authed={authed}
        loginHref={loginHref}
      />
    </div>
  );
}
