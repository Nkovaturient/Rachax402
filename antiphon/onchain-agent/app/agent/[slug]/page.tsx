import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ArenaDashboard } from "@/app/components/agent/ArenaDashboard";
import { AgentAArena } from "@/app/components/agent/AgentAArena";
import { isValidAgentSlug, getSdgAgent, AGENTA_SLUG, STATIC_AGENT_SLUGS } from "@/lib/data/registry";

export function generateStaticParams() {
  return STATIC_AGENT_SLUGS.map((slug) => ({ slug }));
}

type Props = { params: Promise<{ slug: string }> };

export default async function AgentSlugPage({ params }: Props) {
  const { slug } = await params;
  if (!isValidAgentSlug(slug)) notFound();

  if (slug === AGENTA_SLUG) {
    return <AgentAArena />;
  }

  const agent = getSdgAgent(slug);
  if (!agent) notFound();

  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-sm text-secondary">Loading arena…</div>
      }
    >
      <ArenaDashboard agent={agent} />
    </Suspense>
  );
}
