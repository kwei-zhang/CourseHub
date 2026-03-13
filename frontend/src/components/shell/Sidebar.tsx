"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const role = user?.role ?? "student";

  const navItems = [
    {
      href: "/resources",
      label: "Resources",
      roles: ["student", "ta", "instructor"],
    },
    { href: "/upload", label: "Upload", roles: ["ta", "instructor"] },
    { href: "/manage", label: "Manage", roles: ["ta", "instructor"] },
  ];

  const visibleItems = navItems.filter((item) =>
    item.roles.includes(role),
  );

  return (
    <aside className="w-60 border-r min-h-[calc(100vh-56px)] p-4">
      <div className="text-sm font-medium mb-3 text-muted-foreground">
        Navigation
      </div>

      <div className="space-y-1">
        {visibleItems.map((item) => {
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-md px-3 py-2 text-sm transition
                ${active ? "bg-muted font-medium" : "hover:bg-muted"}
              `}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
