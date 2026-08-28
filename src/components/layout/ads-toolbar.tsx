"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/input";
import { FiltersBar } from "@/components/layout/filters-bar";
import { ArrowDownUp } from "lucide-react";

const SORT_OPTIONS = [
  { value: "cost", label: "Maior investimento" },
  { value: "roas", label: "Maior ROAS" },
  { value: "conversions", label: "Mais conversões" },
  { value: "cpa", label: "Menor CPA" },
  { value: "ctr", label: "Maior CTR" },
];

export function AdsToolbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sort = searchParams.get("sort") ?? "cost";

  function updateSort(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <FiltersBar />
      <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5">
        <ArrowDownUp className="size-3.5 text-muted" />
        <Select
          value={sort}
          onChange={(e) => updateSort(e.target.value)}
          className="h-auto border-0 bg-transparent p-0 text-sm focus-visible:ring-0"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
