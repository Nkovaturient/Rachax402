import type { User as SupabaseUser } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma.client";

export async function upsertUser(supabaseUser: SupabaseUser) {
  const email = supabaseUser.email;
  if (!email) {
    throw new Error("Supabase user missing email");
  }

  return prisma.user.upsert({
    where: { supabaseId: supabaseUser.id },
    create: {
      supabaseId: supabaseUser.id,
      email,
      name:
        supabaseUser.user_metadata?.full_name ??
        supabaseUser.user_metadata?.name ??
        null,
      avatarUrl: supabaseUser.user_metadata?.avatar_url ?? null,
    },
    update: {
      email,
      name:
        supabaseUser.user_metadata?.full_name ??
        supabaseUser.user_metadata?.name ??
        undefined,
      avatarUrl: supabaseUser.user_metadata?.avatar_url ?? undefined,
    },
  });
}
