"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { href: "/resources", label: "Resources" },
    { href: "/upload", label: "Upload" },
    { href: "/manage", label: "Manage" },
  ];

  return (
    <aside className="w-60 border-r min-h-[calc(100vh-56px)] p-4">
      <div className="text-sm font-medium mb-3 text-muted-foreground">
        Navigation
      </div>

      <div className="space-y-1">
        {navItems.map((item) => {
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
