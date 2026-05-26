"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  const signInWithGoogle = async () => {
    const supabase = createClient();
    const origin = window.location.origin;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    });
  };

  const signInWithEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("idle");
    const supabase = createClient();
    const origin = window.location.origin;
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });
    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }
    setStatus("sent");
    setMessage("Check your email for the magic link.");
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="glass rounded-2xl border border-white/[0.06] p-8 shadow-glow-erc">
        <h1 className="text-2xl font-semibold text-[#e2e8f0] mb-1">Sign in</h1>
        <p className="text-sm text-[#94a3b8] mb-6">
          It's gonna be a lot of 'Agentic' fun. Are you in?
        </p>

        <button
          type="button"
          onClick={signInWithGoogle}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-sm font-medium text-[#e2e8f0] transition mb-4"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden>
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs text-[#64748b]">or</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <form onSubmit={signInWithEmail} className="space-y-3">
          <input
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 rounded-xl glass border border-white/10 text-sm placeholder:text-[#64748b] focus:outline-none focus:ring-1 focus:ring-[#8b5cf6]/50 bg-white/[0.02]"
          />
          <button
            type="submit"
            className="w-full py-3 rounded-xl font-semibold text-sm gradient-rachax text-white shadow-glow-erc hover:opacity-95 transition"
          >
            Send magic link
          </button>
        </form>

        {status === "sent" && (
          <p className="mt-4 text-sm text-[#10b981]">{message}</p>
        )}
        {status === "error" && (
          <p className="mt-4 text-sm text-red-400">{message}</p>
        )}

        <p className="mt-6 text-center text-xs text-[#64748b]">
          <Link href="/" className="hover:text-[#94a3b8] transition">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
