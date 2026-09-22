"use client";

import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn, formatDate, formatBRL, formatNumber } from "@/lib/utils";
import type { ChartFormat } from "@/components/dashboard/time-series-chart";

const FORMATTERS: Record<ChartFormat, (v: number) => string> = {
  brl: (v) => formatBRL(v),
  number: (v) => formatNumber(v),
  decimal1: (v) => formatNumber(v, 1),
};

export type TrendMetric = { key: string; label: string; format: ChartFormat; color: string };

/** One chart standing in for what used to be three separate cards (Investimento/Faturamento/
 *  Conversões), each with its own chart TYPE (area/line/bar) for no content reason — same data
 *  shape, just picked at random. A segmented control swaps which series plots, always as an
 *  area, so switching metrics is a value change, not a chart-language change. */
export function MetricTrendChart({
  title,
  data,
  metrics,
}: {
  title: string;
  data: Record<string, number | string>[];
  metrics: TrendMetric[];
}) {
  const [activeKey, setActiveKey] = useState(metrics[0].key);
  const active = metrics.find((m) => m.key === activeKey) ?? metrics[0];
  const formatter = FORMATTERS[active.format];
  const gradientId = `grad-trend-${active.key}`;

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-2">
        <CardTitle>{title}</CardTitle>
        <div className="inline-flex gap-1 rounded-lg bg-surface-2 p-1">
          {metrics.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setActiveKey(m.key)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                m.key === active.key ? "bg-surface text-foreground shadow-sm" : "text-muted hover:text-foreground"
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="pl-1">
        {data.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-muted">
            Sem dados no período selecionado.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={active.color} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={active.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(d) => formatDate(d).replace(".", "")}
                tick={{ fontSize: 11, fill: "var(--color-muted)" }}
                axisLine={false}
                tickLine={false}
                minTickGap={24}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--color-muted)" }}
                axisLine={false}
                tickLine={false}
                width={56}
                tickFormatter={(v) => formatter(v)}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                cursor={{ fill: "var(--color-surface-2)", opacity: 0.5 }}
                labelFormatter={(d) => formatDate(d as string)}
                formatter={(v) => [formatter(Number(v)), active.label]}
              />
              <Area type="monotone" dataKey={active.key} stroke={active.color} fill={`url(#${gradientId})`} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
