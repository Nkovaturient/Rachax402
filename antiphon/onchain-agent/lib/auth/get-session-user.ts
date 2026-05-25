import { createClient } from "@/lib/supabase/server";
import { upsertUser } from "@/lib/auth/upsert-user";

export async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const dbUser = await upsertUser(user);
  return { supabaseUser: user, dbUser };
}
