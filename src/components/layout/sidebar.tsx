"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { CLIENT_NAV, ADMIN_NAV } from "@/lib/nav";

const RAIL_WIDTH = 72;

export function Sidebar({ role, appName }: { role: "ADMIN" | "CLIENT"; appName: string }) {
  const pathname = usePathname();
  const items = role === "ADMIN" ? ADMIN_NAV : CLIENT_NAV;

  return (
    // The outer <aside> stays a fixed rail width in normal flow, so the page content next to it
    // never shifts. The inner panel is absolutely positioned over that same left edge and grows
    // wider on hover (group-hover), overlapping the content instead of pushing it.
    <aside className="group relative hidden shrink-0 lg:block" style={{ width: RAIL_WIDTH }}>
      <div className="absolute inset-y-0 left-0 z-30 flex w-[72px] flex-col overflow-hidden border-r border-border bg-surface shadow-[var(--shadow-card)] transition-[width] duration-200 ease-out group-hover:w-64">
        <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-border px-4">
          <Image src="/brand/v4-logo.png" alt="V4" width={28} height={28} className="shrink-0" priority />
          <span className="min-w-0 truncate whitespace-nowrap text-sm font-semibold tracking-tight opacity-0 transition-opacity delay-75 duration-150 group-hover:opacity-100">
            {appName}
          </span>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto overflow-x-hidden px-3 py-4 scrollbar-thin">
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary-soft text-primary"
                    : "text-muted hover:bg-surface-2 hover:text-foreground"
                )}
              >
                <Icon className="size-4.5 shrink-0" />
                <span className="min-w-0 truncate whitespace-nowrap opacity-0 transition-opacity delay-75 duration-150 group-hover:opacity-100">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="shrink-0 whitespace-nowrap border-t border-border p-4 text-xs text-muted-2 opacity-0 transition-opacity delay-75 duration-150 group-hover:opacity-100">
          V4 Lima Soares - Performance
        </div>
      </div>
    </aside>
  );
}
