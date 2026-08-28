"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/input";
import { Calendar } from "lucide-react";

const PERIOD_OPTIONS = [
  { value: "today", label: "Hoje" },
  { value: "7d", label: "Últimos 7 dias" },
  { value: "14d", label: "Últimos 14 dias" },
  { value: "30d", label: "Últimos 30 dias" },
  { value: "90d", label: "Últimos 90 dias" },
];

const PLATFORM_OPTIONS = [
  { value: "all", label: "Todas as plataformas" },
  { value: "GOOGLE_ADS", label: "Google Ads" },
  { value: "META_ADS", label: "Meta Ads" },
];

export function FiltersBar({ showPlatform = true }: { showPlatform?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const period = searchParams.get("period") ?? "30d";
  const platform = searchParams.get("platform") ?? "all";

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all" || value === "") params.delete(key);
    else params.set(key, value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5">
        <Calendar className="size-3.5 text-muted" />
        <Select
          value={period}
          onChange={(e) => update("period", e.target.value)}
          className="h-auto border-0 bg-transparent p-0 text-sm focus-visible:ring-0"
        >
          {PERIOD_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </div>

      {showPlatform && (
        <Select
          value={platform}
          onChange={(e) => update("platform", e.target.value)}
          className="w-auto"
        >
          {PLATFORM_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      )}
    </div>
  );
}
