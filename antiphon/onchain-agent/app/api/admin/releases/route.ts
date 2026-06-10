import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth/is-admin";
import { setActiveRelease } from "@/lib/agent/release";
import { invalidateAgentCache } from "@/app/api/agent/create-agent";
import { z } from "zod";

const Body = z.object({ agentSlug: z.string(), version: z.number().int().positive() });

export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { agentSlug, version } = parsed.data;
  const release = await setActiveRelease(agentSlug, version);
  invalidateAgentCache(agentSlug);

  return NextResponse.json({ ok: true, release });
}
