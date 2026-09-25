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
 *  the sidebar does for Controle de SLA.
 *
 *  With up to 11 items (admin) this got visually cramped as one undifferentiated strip, so items
 *  are clustered into "visão geral / canais / análise" with a thin divider between clusters — the
 *  clustering is purely visual (based on href, not a nav.ts data change) since the underlying item
 *  order already happens to follow this grouping. "Ajuda" isn't a data tab like the others, so it
 *  gets pushed to the far end with its own divider instead of blending into the strip. */
const CHANNEL_HREFS = new Set(["/google-ads", "/meta-ads", "/campanhas", "/anuncios"]);
const OVERVIEW_HREFS = new Set(["/dashboard", "/contas"]);

function clusterOf(href: string): "overview" | "channels" | "insights" {
  if (OVERVIEW_HREFS.has(href)) return "overview";
  if (CHANNEL_HREFS.has(href)) return "channels";
  return "insights";
}

export function PerformanceTabs({ items, active, queryString }: { items: NavItem[]; active: string; queryString?: string }) {
  const help = items.find((item) => item.href === "/ajuda");
  const tabs = items.filter((item) => item.href !== "/ajuda");

  return (
    <div className="mb-6 -mx-1 overflow-x-auto px-1 scrollbar-thin">
      <div className="inline-flex min-w-full items-center gap-1.5 rounded-lg bg-surface-2 p-1.5">
        {tabs.map((item, i) => {
          const prevCluster = i > 0 ? clusterOf(tabs[i - 1].href) : null;
          const cluster = clusterOf(item.href);
          return (
            <div key={item.href} className="flex shrink-0 items-center gap-1.5">
              {prevCluster && prevCluster !== cluster && (
                <div className="mx-0.5 h-5 w-px shrink-0 bg-border" />
              )}
              <TabLink item={item} active={active} queryString={queryString} />
            </div>
          );
        })}

        {help && (
          <>
            <div className="mx-0.5 h-5 w-px shrink-0 bg-border" />
            <div className="ml-auto shrink-0">
              <TabLink item={help} active={active} queryString={queryString} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function TabLink({ item, active, queryString }: { item: NavItem; active: string; queryString?: string }) {
  const isActive = item.href === active;
  const Icon = item.icon;
  return (
    <Link
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
}
