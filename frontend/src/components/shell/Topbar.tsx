"use client";

import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";

export default function Topbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <div className="h-14 border-b flex items-center justify-between px-6">
      <div className="font-semibold">LRMS</div>

      <div className="flex items-center gap-3">
        {user && (
          <Badge variant="secondary">{user.role.toUpperCase()}</Badge>
        )}
        <button
          onClick={handleLogout}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
