import type { LucideIcon } from "lucide-react";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn, pctChange } from "@/lib/utils";

const TONE_CLASSES: Record<"primary" | "positive" | "info" | "warning", string> = {
  primary: "bg-primary-soft text-primary",
  positive: "bg-positive-soft text-positive",
  info: "bg-info-soft text-info",
  warning: "bg-warning-soft text-warning",
};

/** The headline numbers on a page — bigger type, a colored icon badge, delta as a pill instead of
 *  plain text. Deliberately a separate component from `StatCard` (used in dozens of places) so
 *  this page can look more premium without changing how every other stat grid in the app renders. */
export function HeroStat({
  label,
  value,
  previousValue,
  icon: Icon,
  formatter,
  invertDelta = false,
  tone = "primary",
  className,
}: {
  label: string;
  value: number;
  previousValue?: number;
  icon: LucideIcon;
  formatter: (v: number) => string;
  invertDelta?: boolean;
  tone?: "primary" | "positive" | "info" | "warning";
  className?: string;
}) {
  const delta = previousValue !== undefined ? pctChange(value, previousValue) : null;
  const isGood = delta === null ? null : invertDelta ? delta < 0 : delta > 0;

  return (
    <Card className={cn("relative p-5 transition-transform hover:-translate-y-0.5", className)}>
      <div className="flex items-center gap-3">
        <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", TONE_CLASSES[tone])}>
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-xs font-medium uppercase tracking-wide text-muted">{label}</div>
          <div className="mt-0.5 break-words text-[26px] font-bold leading-tight tabular-nums">{formatter(value)}</div>
        </div>
      </div>
      {delta !== null && (
        <div
          className={cn(
            "mt-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
            isGood === null ? "bg-surface-2 text-muted" : isGood ? "bg-positive-soft text-positive" : "bg-negative-soft text-negative"
          )}
        >
          {delta === 0 ? <Minus className="size-3" /> : delta > 0 ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
          {Math.abs(delta).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%
          <span className="font-normal text-muted-2">vs. anterior</span>
        </div>
      )}
    </Card>
  );
}
