"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

const PROTOCOL_LINKS = [
  { label: "ERC-8004", href: "https://github.com/polus-dev/erc-8004", color: "text-[#8b5cf6]" },
  { label: "x402", href: "https://github.com/coinbase/x402", color: "text-[#10b981]" },
  { label: "Storacha", href: "https://github.com/storacha/storacha", color: "text-[#00d4aa]" },
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const isApp = pathname.startsWith("/agent");
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-50 glass border-b border-white/5">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <Image
            src="/Rachax402-logo.png"
            alt="Rachax402"
            width={36}
            height={36}
            className="rounded-lg"
            unoptimized
          />
          <span className="text-xl font-semibold text-gradient-rachax">Rachax402</span>
        </Link>

        <div className="hidden sm:flex items-center gap-3">
          {PROTOCOL_LINKS.map((p) => (
            <a
              key={p.label}
              href={p.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-xs ${p.color} hover:opacity-80 transition`}
            >
              {p.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {isApp && user && (
            <span className="hidden md:inline text-xs text-[#64748b] truncate max-w-[140px]">
              {user.email}
            </span>
          )}
          {user ? (
            <>
              {!isApp && (
                <Link
                  href="/agent"
                  className="px-4 py-2 rounded-full text-sm font-semibold bg-[#dfff00] text-[#0a0b0f] hover:opacity-90 transition"
                >
                  Dashboard
                </Link>
              )}
              <button
                type="button"
                onClick={signOut}
                className="text-xs text-[#94a3b8] hover:text-[#e2e8f0] px-3 py-2 rounded-lg hover:bg-white/5 transition"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 rounded-full text-sm font-semibold bg-[#dfff00] text-[#0a0b0f] hover:opacity-90 transition"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
