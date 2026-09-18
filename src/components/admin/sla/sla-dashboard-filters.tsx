"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Calendar } from "lucide-react";
import { Select, Input } from "@/components/ui/input";
import { SLA_PERIOD_OPTIONS } from "@/lib/sla-dashboard";
import { clientLabel } from "@/lib/sla-config";

export function SlaDashboardFilters({ clients }: { clients: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const period = searchParams.get("period") ?? "30d";
  const client = searchParams.get("client") ?? "";
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";

  function update(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (!value) params.delete(key);
      else params.set(key, value);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5">
        <Calendar className="size-3.5 text-muted" />
        <Select
          value={period}
          onChange={(e) => update({ period: e.target.value })}
          className="h-auto border-0 bg-transparent p-0 text-sm focus-visible:ring-0"
        >
          {SLA_PERIOD_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </div>

      {period === "custom" && (
        <div className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2 py-1">
          <Input
            type="date"
            value={from}
            max={to || undefined}
            onChange={(e) => update({ from: e.target.value })}
            className="h-auto border-0 bg-transparent p-0 text-sm focus-visible:ring-0"
            aria-label="Data inicial"
          />
          <span className="text-xs text-muted-2">até</span>
          <Input
            type="date"
            value={to}
            min={from || undefined}
            onChange={(e) => update({ to: e.target.value })}
            className="h-auto border-0 bg-transparent p-0 text-sm focus-visible:ring-0"
            aria-label="Data final"
          />
        </div>
      )}

      <Select value={client} onChange={(e) => update({ client: e.target.value })} className="w-auto">
        <option value="">Todos os clientes</option>
        {clients.map((c) => (
          <option key={c} value={c}>
            {clientLabel(c)}
          </option>
        ))}
      </Select>
    </div>
  );
}
