import type { LucideIcon } from "lucide-react";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { pctChange } from "@/lib/utils";

export function StatCard({
  label,
  value,
  previousValue,
  icon: Icon,
  formatter,
  invertDelta = false,
  className,
}: {
  label: string;
  value: number;
  previousValue?: number;
  icon?: LucideIcon;
  formatter: (v: number) => string;
  /** true for metrics where a decrease is the good direction (e.g. CPA, CPC) */
  invertDelta?: boolean;
  /** For grids whose item count isn't a multiple of the column count — lets the card flex/wrap
   *  instead of leaving a dangling empty cell in the last row (see Dashboard's "Métricas
   *  detalhadas"). Merged onto the default padding, not a replacement for it. */
  className?: string;
}) {
  const delta = previousValue !== undefined ? pctChange(value, previousValue) : null;
  const isGood = delta === null ? null : invertDelta ? delta < 0 : delta > 0;

  return (
    <Card className={cn("p-5", className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">{label}</span>
        {Icon && <Icon className="size-4 text-muted-2" />}
      </div>
      <div className="mt-2 break-words text-2xl font-semibold tabular-nums">{formatter(value)}</div>
      {delta !== null && (
        <div
          className={cn(
            "mt-1.5 inline-flex items-center gap-1 text-xs font-medium",
            isGood === null ? "text-muted" : isGood ? "text-positive" : "text-negative"
          )}
        >
          {delta === 0 ? <Minus className="size-3" /> : delta > 0 ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
          {Math.abs(delta).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%
          <span className="font-normal text-muted-2">vs. período anterior</span>
        </div>
      )}
    </Card>
  );
}
