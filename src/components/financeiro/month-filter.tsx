"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Calendar } from "lucide-react";
import { Select } from "@/components/ui/input";
import { MONTH_NAMES } from "@/lib/financeiro-constants";

const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

export function FinanceiroMonthFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const now = new Date();
  const month = Number(searchParams.get("month") ?? now.getMonth() + 1);
  const year = Number(searchParams.get("year") ?? now.getFullYear());

  function update(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) params.set(key, value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5">
        <Calendar className="size-3.5 text-muted" />
        <span className="text-xs text-muted">Mês:</span>
        <Select
          value={month}
          onChange={(e) => update({ month: e.target.value })}
          className="h-auto border-0 bg-transparent p-0 text-sm focus-visible:ring-0"
        >
          {MONTH_NAMES.map((name, i) => (
            <option key={name} value={i + 1}>
              {name}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5">
        <span className="text-xs text-muted">Ano:</span>
        <Select
          value={year}
          onChange={(e) => update({ year: e.target.value })}
          className="h-auto border-0 bg-transparent p-0 text-sm focus-visible:ring-0"
        >
          {YEARS.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
