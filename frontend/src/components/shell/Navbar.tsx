"use client";

import Link from "next/link";
import { BookOpen, LogIn, UserCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <header className="sticky top-0 z-50 flex h-20 w-full shrink-0 items-center border-b bg-background/80 px-6 backdrop-blur-sm md:px-10 lg:px-16">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <Link href="/resources" className="flex items-center gap-2 font-semibold">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BookOpen className="size-4" />
          </div>
          LRMS
        </Link>
        {user && (
          <span className="text-xs text-muted-foreground">{user.role}</span>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right side */}
      <div className="flex items-center gap-3">
        {user ? (
          <>
            <Link href="/profile">
              <Button variant="outline" size="sm" className="gap-2">
                <UserCircle2 className="size-4" />
                {user.email}
              </Button>
            </Link>
            {(user.role === "instructor" || user.role === "ta") && (
              <Link href="/manage">
                <Button variant="outline" size="sm">Manage</Button>
              </Link>
            )}
            {user.role === "admin" && (
              <Link href="/admin">
                <Button variant="outline" size="sm">Admin</Button>
              </Link>
            )}
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Sign out
            </Button>
          </>
        ) : (
          <Link href="/login">
            <Button variant="outline" className="gap-2 px-6 h-11">
              <LogIn className="size-4" />
              Sign in
            </Button>
          </Link>
        )}
      </div>
    </header>
  );
}
