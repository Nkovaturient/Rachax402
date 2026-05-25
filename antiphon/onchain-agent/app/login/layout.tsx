import { SiteHeader } from "../components/SiteHeader";

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main className="flex-grow flex items-center justify-center px-3 sm:px-4 py-12">
        {children}
      </main>
    </>
  );
}
