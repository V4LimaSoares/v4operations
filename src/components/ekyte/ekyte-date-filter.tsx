"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Calendar } from "lucide-react";
import { Select, Input } from "@/components/ui/input";
import { EKYTE_PERIOD_OPTIONS, EKYTE_DATA_MIN, EKYTE_DATA_MAX, ekyteRangeFromParams } from "@/lib/data/ekyte";

/**
 * The date-range cutoff for the whole Ekyte group. Lives in the URL (`period` preset, or a
 * custom `from`/`to`) — same convention as FiltersBar — so every Ekyte page (all Server
 * Components) reads the same params and re-renders against the same slice. The sidebar carries
 * this querystring forward when switching between the group's own subpages (see sidebar.tsx).
 */
export function EkyteDateFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const period = searchParams.get("period") ?? (searchParams.get("from") ? "" : "30d");
  const range = ekyteRangeFromParams({
    period: searchParams.get("period") ?? undefined,
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
  });

  function applyPreset(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", value);
    params.delete("from");
    params.delete("to");
    router.push(`${pathname}?${params.toString()}`);
  }

  function applyCustom(key: "from" | "to", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("period");
    const next = { from: range.start, to: range.end, [key]: value };
    params.set("from", next.from);
    params.set("to", next.to);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5">
        <Calendar className="size-3.5 text-muted" />
        <Select
          value={period}
          onChange={(e) => applyPreset(e.target.value)}
          className="h-auto border-0 bg-transparent p-0 text-sm focus-visible:ring-0"
        >
          {!period && <option value="">Período personalizado</option>}
          {EKYTE_PERIOD_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2 py-1">
        <Input
          type="date"
          aria-label="Data inicial"
          value={range.start}
          min={EKYTE_DATA_MIN}
          max={EKYTE_DATA_MAX}
          onChange={(e) => applyCustom("from", e.target.value)}
          className="h-7 w-[132px] border-0 bg-transparent px-1 text-xs focus-visible:ring-0"
        />
        <span className="text-xs text-muted-2">–</span>
        <Input
          type="date"
          aria-label="Data final"
          value={range.end}
          min={EKYTE_DATA_MIN}
          max={EKYTE_DATA_MAX}
          onChange={(e) => applyCustom("to", e.target.value)}
          className="h-7 w-[132px] border-0 bg-transparent px-1 text-xs focus-visible:ring-0"
        />
      </div>
    </div>
  );
}
