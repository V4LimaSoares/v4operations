"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { visibleNavGroups } from "@/lib/nav";

export function MobileNav({
  role,
  appName,
  modulePermissions,
}: {
  role: "ADMIN" | "STAFF" | "CLIENT";
  appName: string;
  modulePermissions: string[];
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const groups = visibleNavGroups(role, modulePermissions);

  return (
    <div className="lg:hidden">
      <button
        aria-label="Abrir menu"
        onClick={() => setOpen(true)}
        className="flex size-9 items-center justify-center rounded-lg border border-border bg-surface"
      >
        <Menu className="size-4" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative flex w-72 flex-col bg-surface">
            <div className="flex h-16 items-center justify-between border-b border-border px-5">
              <span className="text-sm font-semibold">{appName}</span>
              <button onClick={() => setOpen(false)} aria-label="Fechar menu">
                <X className="size-4" />
              </button>
            </div>
            <nav className="flex-1 space-y-4 overflow-y-auto p-3">
              {groups.map((group) => (
                <div key={group.label}>
                  {/* A one-item group's single link already carries the group's label — a
                      section heading above it would just repeat the same word twice. */}
                  {group.items.length > 1 && (
                    <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-2">{group.label}</p>
                  )}
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const active = pathname === item.href || pathname.startsWith(item.href + "/");
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium",
                            active ? "bg-primary-soft text-primary" : "text-muted hover:bg-surface-2"
                          )}
                        >
                          <Icon className="size-4" />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
