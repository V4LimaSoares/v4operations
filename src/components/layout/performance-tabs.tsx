import Link from "next/link";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/lib/nav";

/** Performance's subpages (Dashboard, Google Ads, Meta Ads, Campanhas…) as a tab bar at the top
 *  of each of those pages — same visual language as Equipes/Squad and Materiais' tabs, but these
 *  are real separate routes (each keeps its own server-side data fetching), not client-toggled
 *  panels, so switching tabs never fetches every section's data at once. Plain server component
 *  (no "use client") — a client component here would need to receive the `icon` values as bare
 *  component references, which Next.js can't serialize across the server/client boundary; `href`,
 *  `label` and a rendered icon element are all this needs, and Link works fine server-rendered.
 *  Carries the current filters (`?clientId=`, `?period=`…) across tabs via `queryString`, same as
 *  the sidebar does for Controle de SLA. */
export function PerformanceTabs({ items, active, queryString }: { items: NavItem[]; active: string; queryString?: string }) {
  return (
    <div className="mb-6 -mx-1 overflow-x-auto px-1 scrollbar-thin">
      <div className="inline-flex min-w-full gap-1 rounded-lg bg-surface-2 p-1">
        {items.map((item) => {
          const isActive = item.href === active;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={queryString ? `${item.href}?${queryString}` : item.href}
              className={cn(
                "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                isActive ? "bg-surface text-foreground shadow-sm" : "text-muted hover:text-foreground"
              )}
            >
              <Icon className="size-3.5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
