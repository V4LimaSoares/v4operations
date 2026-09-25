"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [isRefreshing, startRefresh] = useTransition();
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Runs on mount (page load) and again whenever a refresh transition settles, so the label
  // always reflects when the data currently on screen was actually fetched from the banco.
  useEffect(() => {
    if (!isRefreshing) setLastUpdated(new Date());
  }, [isRefreshing]);

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

      <Button
        variant="outline"
        size="sm"
        onClick={() => startRefresh(() => router.refresh())}
        disabled={isRefreshing}
        className="gap-1.5"
      >
        <RefreshCw className={cn("size-3.5", isRefreshing && "animate-spin")} />
        {isRefreshing ? "Atualizando…" : "Atualizar"}
      </Button>
      {lastUpdated && (
        <span className="text-xs text-muted-2">
          Atualizado às {lastUpdated.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
        </span>
      )}
    </div>
  );
}
