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
  // { label: "Storacha", href: "https://github.com/storacha/storacha", color: "text-[#00d4aa]" },
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const onAgentRoute = pathname.startsWith("/agent");
  const onLanding = pathname === "/";
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
    <header className="sticky top-0 z-50 glass border-b border-white/5 bg-[#0a0b0f]/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <Image
            src="/Rachax402-logo.png"
            alt="Rachax402"
            width={32}
            height={32}
            className="rounded-lg"
            priority
            unoptimized
          />
          <span className="text-lg font-semibold text-gradient-rachax hidden sm:inline">
            Rachax402
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-5">
          <Link
            href="/marketplace"
            className={`text-xs font-medium transition ${
              pathname === "/marketplace"
                ? "text-[#dfff00]"
                : "text-[#94a3b8] hover:text-[#e2e8f0]"
            }`}
          >
            Marketplace
          </Link>
          <Link
            href="/agent/agenta"
            className={`text-xs font-medium transition ${
              pathname === "/agent/agenta"
                ? "text-[#07f49e]"
                : "text-[#c02595] hover:text-[#e2e8f0]"
            }`}
          >
            Agent_A
          </Link>
          {PROTOCOL_LINKS.map((p) => (
            <a
              key={p.label}
              href={p.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-xs ${p.color} hover:opacity-80`}
            >
              {p.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          {onAgentRoute && user && (
            <span className="hidden lg:inline text-xs text-[#64748b] truncate max-w-[120px]">
              {user.email}
            </span>
          )}

          {user ? (
            <>
              <button
                type="button"
                onClick={signOut}
                className="text-xs text-[#94a3b8] hover:text-[#e2e8f0] px-2 py-1.5"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 rounded-full text-xs font-semibold border border-white/20 text-[#e2e8f0] hover:bg-white/5"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
