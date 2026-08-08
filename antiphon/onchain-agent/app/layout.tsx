import type { Metadata } from "next";
import { Outfit, JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { PlatformAtmosphere } from "@/app/components/ui/PlatformAtmosphere";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Antiphon",
  icons: {
    icon: "/Rachax402-logo.png",
  },
  description:
    "Agent marketplace with ERC-8004 discovery, x402 payments, and Pinata IPFS — research agents meet autonomous commerce.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${jakarta.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen flex flex-col text-secondary antialiased">
        <PlatformAtmosphere />
        <div className="platform-content">
          {children}
          <footer className="flex-none py-5 border-t border-white/[0.06] mt-auto glass-rail bottom-0 w-full">
            <div className="max-w-6xl mx-auto px-4 text-center">
              <p className="text-xs text-muted">
                <a
                  href="https://github.com/Nkovaturient/Rachax402"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-secondary hover:text-storacha transition"
                >
                  Antiphon
                </a>
                {" · "}
                Discover, Pay, Verify — on-chain.
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
