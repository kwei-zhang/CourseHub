"use client";

import { useAuth } from "@/lib/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "./Sidebar";

const PUBLIC_PATHS = ["/login"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (isLoading) return;
    if (!user && !isPublic) {
      router.replace("/login");
    } else if (user && isPublic) {
      router.replace("/resources");
    }
  }, [user, isLoading, pathname, router, isPublic]);

  // Show nothing while determining auth state to avoid flash
  if (isLoading) return null;

  // Redirect check — render nothing until navigation completes
  if (!user && !isPublic) return null;
  if (user && isPublic) return null;

  // Login page — no shell
  if (isPublic) return <>{children}</>;

  // Authenticated pages — full shell
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
