"use client";

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatBRL, formatNumber } from "@/lib/utils";
import type { ChartFormat } from "@/components/dashboard/time-series-chart";

const FORMATTERS: Record<ChartFormat, (v: number) => string> = {
  brl: (v) => formatBRL(v),
  number: (v) => formatNumber(v),
  decimal1: (v) => formatNumber(v, 1),
};

export type DonutSlice = { name: string; value: number; color: string };

export function DonutChart({
  title,
  data,
  format,
}: {
  title: string;
  data: DonutSlice[];
  format: ChartFormat;
}) {
  const formatter = FORMATTERS[format];
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="pl-1">
        {total <= 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-muted">
            Sem dados no período selecionado.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={62}
                outerRadius={92}
                paddingAngle={3}
                strokeWidth={0}
              >
                {data.map((slice) => (
                  <Cell key={slice.name} fill={slice.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                formatter={(v, name) => [formatter(Number(v)), name]}
              />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                iconSize={8}
                formatter={(value) => <span style={{ color: "var(--color-muted)", fontSize: 12 }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
