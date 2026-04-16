import { TopNavbar } from "@/components/layout/TopNavbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { FontLoader } from "@/components/editor/FontLoader";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <FontLoader />
      <TopNavbar />
      <div className="flex min-h-[calc(100vh-64px)]">
        <Sidebar />
        <main className="flex-1 p-6 md:p-10 overflow-y-auto pb-20 md:pb-10">
          {children}
        </main>
      </div>
      <MobileBottomNav />
    </>
  );
}
