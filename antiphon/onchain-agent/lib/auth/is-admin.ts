import { getSessionUser } from "./get-session-user";

export async function isAdmin(): Promise<boolean> {
  const allowed = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (allowed.length === 0) return false;

  const session = await getSessionUser();
  if (!session) return false;

  return allowed.includes(session.supabaseUser.email?.toLowerCase() ?? "");
}
