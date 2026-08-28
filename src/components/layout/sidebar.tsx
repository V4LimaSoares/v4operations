"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CLIENT_NAV, ADMIN_NAV } from "@/lib/nav";

export function Sidebar({ role, appName }: { role: "ADMIN" | "CLIENT"; appName: string }) {
  const pathname = usePathname();
  const items = role === "ADMIN" ? ADMIN_NAV : CLIENT_NAV;

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface lg:flex">
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <BarChart3 className="size-4.5" />
        </div>
        <span className="text-sm font-semibold tracking-tight">{appName}</span>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4 scrollbar-thin">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary-soft text-primary"
                  : "text-muted hover:bg-surface-2 hover:text-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-4 text-xs text-muted-2">
        Portal de Tráfego Pago
      </div>
    </aside>
  );
}
