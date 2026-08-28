import { ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatBRL, formatNumber, formatPercent, formatDate } from "@/lib/utils";
import type { FunnelData } from "@/lib/data/funnel";

export function FunnelChart({ data }: { data: FunnelData }) {
  const steps = [
    { name: "Impressões", value: data.impressions, rateFromPrevious: null as number | null, costPer: null as number | null },
    {
      name: "Cliques",
      value: data.clicks,
      rateFromPrevious: data.impressions > 0 ? (data.clicks / data.impressions) * 100 : null,
      costPer: data.clicks > 0 ? data.costBrl / data.clicks : null,
    },
    ...data.stages.map((s) => ({
      name: s.name,
      value: s.conversions,
      rateFromPrevious: s.rateFromPrevious,
      costPer: s.costPerConversion,
    })),
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Funil de conversão</CardTitle>
        <p className="text-xs text-muted">
          Período sincronizado: {formatDate(data.periodStart)} a {formatDate(data.periodEnd)}
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-stretch gap-2">
          {steps.map((step, i) => (
            <div key={step.name} className="flex items-stretch gap-2">
              <div className="flex min-w-32 flex-col justify-center rounded-xl border border-border bg-surface-2 px-4 py-3">
                <span className="text-xs font-medium uppercase tracking-wide text-muted">{step.name}</span>
                <span className="mt-1 text-lg font-semibold tabular-nums">
                  {step.name === "Impressões" || step.name === "Cliques" ? formatNumber(step.value) : formatNumber(step.value, 1)}
                </span>
                {step.rateFromPrevious !== null && (
                  <span className="text-xs text-muted">{formatPercent(step.rateFromPrevious)} do anterior</span>
                )}
                {step.costPer !== null && step.costPer > 0 && (
                  <span className="text-xs text-muted-2">Custo/{step.name.toLowerCase()}: {formatBRL(step.costPer)}</span>
                )}
              </div>
              {i < steps.length - 1 && (
                <div className="flex items-center text-muted-2">
                  <ArrowRight className="size-4" />
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
