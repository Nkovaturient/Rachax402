import { SiteHeader } from "../components/SiteHeader";

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
