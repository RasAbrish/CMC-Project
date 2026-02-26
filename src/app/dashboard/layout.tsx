"use client";

import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSidebarStore } from "@/store/sidebar-store";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const { isOpen } = useSidebarStore();

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  if (isPending) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg-primary)",
        }}
      >
        <div className="spinner" style={{ width: "40px", height: "40px", borderWidth: "3px" }} />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="flex relative min-h-screen bg-[var(--bg-primary)]">
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => useSidebarStore.getState().toggle()}
        />
      )}
      <Sidebar />
      <main className={`flex-1 flex flex-col min-h-screen w-full transition-all duration-300 ${isOpen ? "md:ml-[280px]" : "md:ml-[72px]"}`}>
        <Header />
        <div className="p-4 md:p-6 max-w-[1400px] w-full mx-auto animate-fadeIn">{children}</div>
      </main>
    </div>
  );
}
