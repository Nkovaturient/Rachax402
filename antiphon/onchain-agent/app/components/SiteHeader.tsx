"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

const PROTOCOL_LINKS = [
  { label: "ERC-8004", href: "https://github.com/polus-dev/erc-8004", color: "text-erc8004" },
  { label: "x402", href: "https://github.com/coinbase/x402", color: "text-x402" },
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const onAgentRoute = pathname.startsWith("/agent");
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
    <header className="sticky top-0 z-50 glass-rail border-b border-white/[0.07] backdrop-saturate-150">
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
          <span className="font-display text-lg font-semibold text-gradient-rachax hidden sm:inline">
            Rachax402
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-5">
          <Link
            href="/marketplace"
            className={`text-xs font-medium transition ${
              pathname === "/marketplace" ? "text-neon" : "text-secondary hover:text-primary"
            }`}
          >
            Marketplace
          </Link>
          <Link
            href="/agent/agenta"
            className={`text-xs font-medium transition ${
              pathname === "/agent/agenta"
                ? "text-x402"
                : "text-[#c02595] hover:text-primary"
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
            <span className="hidden lg:inline text-xs text-muted truncate max-w-[120px]">
              {user.email}
            </span>
          )}

          {user ? (
            <button
              type="button"
              onClick={signOut}
              className="text-xs text-secondary hover:text-primary px-2 py-1.5"
            >
              Sign out
            </button>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 rounded-full text-xs font-semibold glass-liquid text-primary hover:brightness-110"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
