import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { AggPoint } from "@/lib/data/ekyte";

export function EkyteRankList({ title, data, color }: { title: string; data: AggPoint[]; color: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2.5">
        {data.length === 0 && <div className="py-8 text-center text-sm text-muted">Sem dados no período selecionado.</div>}
        {data.map((d) => (
          <div key={d.label} className="flex items-center gap-3">
            <span className="w-32 shrink-0 truncate text-xs text-muted" title={d.label}>
              {d.label}
            </span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-2">
              <div className="h-full rounded-full" style={{ width: `${Math.max(4, (d.value / max) * 100)}%`, background: color }} />
            </div>
            <span className="w-6 shrink-0 text-right text-xs font-semibold tabular-nums">{d.value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
