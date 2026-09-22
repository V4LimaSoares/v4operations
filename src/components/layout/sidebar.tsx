"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronDown, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { visibleNavGroups, type NavGroup, type NavItem } from "@/lib/nav";
import { SidebarUserMenu } from "@/components/layout/sidebar-user-menu";

const RAIL_WIDTH = 72;
const PINNED_WIDTH = 256;
const PIN_STORAGE_KEY = "sidebar-pinned";

// Some items (e.g. the "Controle de SLA" subpages) share one route and are only distinguished by
// query params, so exact-pathname matching alone can't tell them apart — compare the item's own
// query string against the current one too.
function itemIsActive(item: NavItem, pathname: string, search: URLSearchParams) {
  const [itemPath, itemQuery] = item.href.split("?");
  if (pathname !== itemPath && !pathname.startsWith(itemPath + "/")) return false;
  if (!itemQuery) {
    // "view" is the discriminator used by sibling items sharing this same path (e.g. the
    // Controle de SLA subpages) — a plain no-query item shouldn't out-shine those when one is set.
    return pathname === itemPath && !search.has("view");
  }
  const itemParams = new URLSearchParams(itemQuery);
  return [...itemParams.entries()].every(([key, value]) => search.get(key) === value);
}

function groupIsActive(group: NavGroup, pathname: string, search: URLSearchParams) {
  return group.items.some((item) => itemIsActive(item, pathname, search));
}

export function Sidebar({
  role,
  appName,
  modulePermissions,
  user,
}: {
  role: "ADMIN" | "STAFF" | "CLIENT";
  appName: string;
  modulePermissions: string[];
  user: { name: string; email: string };
}) {
  const pathname = usePathname();
  const search = useSearchParams();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- modulePermissions is an array; compare
  // by content, not by the new reference React Server Components hand down on every render.
  const groups = useMemo(() => visibleNavGroups(role, modulePermissions), [role, modulePermissions.join(",")]);

  // Defaults to unpinned (hover-to-expand) on first paint — no server-side access to localStorage
  // — then reconciles with the saved preference once mounted, same pattern as the theme toggle.
  const [pinned, setPinned] = useState(false);
  useEffect(() => {
    try {
      setPinned(localStorage.getItem(PIN_STORAGE_KEY) === "1");
    } catch {
      // ignore (private browsing / storage disabled)
    }
  }, []);

  function togglePinned() {
    setPinned((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(PIN_STORAGE_KEY, next ? "1" : "0");
      } catch {
        // ignore (private browsing / storage disabled)
      }
      return next;
    });
  }

  // Visible whenever the panel is actually wide — pinned (always) or hovered (CSS-only, so this
  // can't react to hover state directly; group-hover on the className handles that half).
  const fade = pinned
    ? "opacity-100"
    : "opacity-0 transition-opacity delay-75 duration-150 group-hover:opacity-100";

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const group of groups) initial[group.label] = groupIsActive(group, pathname, search);
    return initial;
  });

  // Auto-expand whichever group contains the page just navigated to, without forcing others shut.
  useEffect(() => {
    setOpenGroups((prev) => {
      const next = { ...prev };
      for (const group of groups) {
        if (groupIsActive(group, pathname, search)) next[group.label] = true;
      }
      return next;
    });
  }, [pathname, search, groups]);

  return (
    // The outer <aside> reserves real layout space equal to whatever the panel currently is —
    // just the icon rail normally, or the full pinned width once locked open, so pinning docks
    // the sidebar (reflowing the page) instead of permanently overlaying content.
    <aside
      className="group relative hidden shrink-0 lg:block transition-[width] duration-200 ease-out"
      style={{ width: pinned ? PINNED_WIDTH : RAIL_WIDTH }}
    >
      <div
        className={cn(
          "absolute inset-y-3 left-3 z-30 flex w-[72px] flex-col overflow-hidden rounded-[28px] bg-gradient-to-b from-primary to-[#b20710] shadow-[0_20px_50px_-12px_rgba(229,8,21,0.45)] transition-[width] duration-200 ease-out",
          pinned ? "w-64" : "group-hover:w-64"
        )}
      >
        <div className="flex h-16 shrink-0 items-center gap-2.5 px-3.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-[0_6px_16px_-4px_rgba(0,0,0,0.3)]">
            <Image src="/brand/v4-logo.png" alt="V4" width={22} height={22} className="shrink-0" priority />
          </div>
          <span className={cn("min-w-0 flex-1 truncate whitespace-nowrap text-sm font-semibold tracking-tight text-white", fade)}>
            {appName}
          </span>
          <button
            type="button"
            onClick={togglePinned}
            title={pinned ? "Soltar sidebar" : "Fixar sidebar aberto"}
            aria-pressed={pinned}
            className={cn(
              "flex size-6 shrink-0 items-center justify-center rounded-md text-white/70 transition-colors hover:bg-white/15 hover:text-white",
              fade
            )}
          >
            {pinned ? <PanelLeftClose className="size-3.5" /> : <PanelLeftOpen className="size-3.5" />}
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden px-3 py-2 scrollbar-thin">
          {groups.map((group) => {
            const GroupIcon = group.icon;

            // A group with exactly one item (Clientes, Equipes, Visão Geral) has nothing to
            // expand — rendering it as an expandable button whose single child repeats the same
            // label is a redundant extra click ("Clientes > Clientes"). Render those as a plain
            // link instead, styled like the button it replaces.
            if (group.items.length === 1) {
              const item = group.items[0];
              const active = itemIsActive(item, pathname, search);
              return (
                <Link
                  key={group.label}
                  href={item.href}
                  title={group.label}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-colors",
                    active
                      ? "border border-white/20 bg-white/16 text-white"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <GroupIcon className="size-4.5 shrink-0" />
                  <span className={cn("min-w-0 flex-1 truncate whitespace-nowrap text-left", fade)}>
                    {group.label}
                  </span>
                </Link>
              );
            }

            const open = openGroups[group.label] ?? false;
            return (
              <div key={group.label}>
                <button
                  type="button"
                  onClick={() =>
                    setOpenGroups((prev) => ({ ...prev, [group.label]: !prev[group.label] }))
                  }
                  title={group.label}
                  aria-expanded={open}
                  className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <GroupIcon className="size-4.5 shrink-0" />
                  <span className={cn("min-w-0 flex-1 truncate whitespace-nowrap text-left", fade)}>
                    {group.label}
                  </span>
                  <ChevronDown
                    className={cn("size-4 shrink-0 transition-transform duration-150", fade, open && "rotate-180")}
                  />
                </button>

                {open && (
                  <div className="mt-0.5 space-y-0.5">
                    {group.items.map((item) => {
                      const active = itemIsActive(item, pathname, search);
                      const Icon = item.icon;
                      // Sibling pages within the group currently open carry the shared query
                      // string forward (e.g. Ekyte's date-range cutoff survives switching between
                      // its Dashboard/Equipe/Tasks/Relatórios subpages). Items that already own a
                      // query string (Controle de SLA's ?view=...) are left untouched.
                      const hasOwnQuery = item.href.includes("?");
                      const qs = search.toString();
                      const href = !hasOwnQuery && qs && groupIsActive(group, pathname, search) ? `${item.href}?${qs}` : item.href;
                      return (
                        <Link
                          key={item.href}
                          href={href}
                          title={item.label}
                          className={cn(
                            "flex items-center gap-3 rounded-xl py-2 pl-6 pr-2.5 text-sm font-medium transition-colors",
                            active
                              ? "border border-white/20 bg-white/16 text-white"
                              : "text-white/65 hover:bg-white/10 hover:text-white"
                          )}
                        >
                          <Icon className="size-4 shrink-0" />
                          <span className={cn("min-w-0 truncate whitespace-nowrap", fade)}>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <SidebarUserMenu name={user.name} email={user.email} role={role} fadeClassName={fade} onRed />
      </div>
    </aside>
  );
}
