import { NextResponse } from "next/server";
import { UN_SDG_META } from "@/lib/data/un-sdg-meta";

export const revalidate = 86400;

export async function GET() {
  return NextResponse.json({
    updatedAt: "2025-05-26",
    goals: UN_SDG_META,
  });
}
