import { SiteHeader } from "../components/SiteHeader";

export default function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main className="flex-grow flex items-center justify-center px-3 sm:px-4 py-6">
        {children}
      </main>
    </>
  );
}
