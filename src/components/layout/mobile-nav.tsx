"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { CLIENT_NAV, ADMIN_NAV } from "@/lib/nav";

export function MobileNav({ role, appName }: { role: "ADMIN" | "CLIENT"; appName: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const items = role === "ADMIN" ? ADMIN_NAV : CLIENT_NAV;

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
            <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
              {items.map((item) => {
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
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
