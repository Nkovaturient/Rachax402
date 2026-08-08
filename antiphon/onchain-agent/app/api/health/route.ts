/* Health check route for the onchain-agent */

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ status: "ok", service: "onchain-agent", agent: "AgentA" });
}
