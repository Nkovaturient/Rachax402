import Link from "next/link";
import { SiteHeader } from "./components/SiteHeader";

const STATS = [
  { value: "~22s", label: "Agent tool execution" },
  { value: "$0.01", label: "USDC per CSV analysis" },
  { value: "~2.5s", label: "ERC-8004 on-chain discovery" },
] as const;

export default function LandingPage() {
  return (
    <div className="landing-smooth min-h-screen flex flex-col">
      <SiteHeader />

      <main className="flex-grow relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          aria-hidden
        >
          <div className="w-[min(90vw,640px)] h-[min(50vh,420px)] rounded-full bg-[#8b5cf6]/20 blur-[100px]" />
          <div className="absolute w-[min(70vw,480px)] h-[min(40vh,320px)] rounded-full bg-[#06b6d4]/15 blur-[80px] translate-y-12" />
        </div>
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
          aria-hidden
        />

        <section className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-12 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-[#f8fafc] tracking-tight leading-[1.1] mb-6">
            <span className="font-bold text-[#dfff00] "> Agents </span> {" "} x {" "}
            <span className="text-gradient-rachax">DeFi</span>
          </h1>
          <p className="text-lg sm:text-xl text-[#94a3b8] max-w-2xl mx-auto mb-4"> 
            Autonomous agents that <span className="font-bold text-[#c02595] ">Discover</span>, <span className="font-bold text-[#07f49e] ">Pay</span>, and <span className="font-bold text-[#80f0ff] ">Verify</span> — Onchain.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-14">
            <Link
              href="/agent"
              className="w-full sm:w-auto px-8 py-3.5 rounded-full text-sm font-bold bg-[#dfff00] text-[#0a0b0f] hover:opacity-90 transition shadow-[0_0_40px_-8px_rgba(223,255,0,0.5)]"
            >
              Open AgentA
            </Link>
          </div>

          <div className="glass rounded-2xl border border-white/[0.08] p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-4 max-w-3xl mx-auto">
            {STATS.map((s) => (
              <div key={s.label}>
                <div className="text-2xl sm:text-3xl font-bold text-[#f8fafc] mb-1">
                  {s.value}
                </div>
                <div className="text-xs sm:text-sm text-[#64748b]">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="relative max-w-5xl mx-auto px-4 sm:px-6 pb-24 pt-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold text-[#e2e8f0] mb-12">
            Onchain economy
          </h2>
          <div className="relative h-48 sm:h-64 flex items-end justify-center overflow-hidden">
            <div
              className="absolute bottom-0 w-[120%] max-w-[800px] aspect-[2/1] rounded-[50%] border border-[#dfff00]/20"
              style={{
                background:
                  "radial-gradient(ellipse at 50% 100%, rgba(223,255,0,0.12) 0%, transparent 70%)",
              }}
            />
            <div className="absolute bottom-4 flex gap-8 text-xs text-[#64748b]">
              <a
                href="https://rachax402-agent.up.railway.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#00d4aa] transition"
              >
                Live demo
              </a>
              <a
                href="https://github.com/Nkovaturient/Rachax402/wiki"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#8b5cf6] transition"
              >
                Wiki
              </a>
              <a
                href="https://youtu.be/1_hBdSQvzKU"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#10b981] transition"
              >
                Video demo
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
