/** Supabase public credentials — must match Railway/local env var names exactly. */
export function getSupabasePublicEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    throw new Error(
      "@supabase/ssr: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required. " +
        "On Railway/Docker they must be set as service Variables before the image build (NEXT_PUBLIC_* is baked in at next build).",
    );
  }

  return { url, anonKey };
}
