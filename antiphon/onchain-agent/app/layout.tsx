import type { Metadata } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Rachax402 · Agent",
  icons: {
    icon: "/Rachax402-logo.png",
  },
  description:
    "Decentralized agent-to-agent service discovery and payment-gated execution: ERC-8004, x402, Storacha.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen flex flex-col bg-[#0a0b0f] text-[#e2e8f0] antialiased">
        {children}
        <footer className="flex-none py-5 border-t border-white/5 mt-auto">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <p className="text-xs text-[#64748b]">
              <a
                href="https://github.com/Nkovaturient/Rachax402"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#94a3b8] hover:text-[#00d4aa] transition"
              >
                Rachax402
              </a>
              {" · "}
              Discover, Pay, Verify — on-chain.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
