"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatDate, formatBRL, formatNumber } from "@/lib/utils";

const METRIC_LABEL: Record<string, string> = {
  costBrl: "Investimento",
  conversionValueBrl: "Valor de conversão",
  conversions: "Conversões",
  clicks: "Cliques",
  impressions: "Impressões",
  amountBrl: "Faturamento",
};

// Server Components can't pass functions to Client Components (RSC serialization boundary),
// so the formatter is selected here from a plain string prop instead of being passed in.
export type ChartFormat = "brl" | "number" | "decimal1";
export type ChartVariant = "area" | "line" | "bar";

const FORMATTERS: Record<ChartFormat, (v: number) => string> = {
  brl: (v) => formatBRL(v),
  number: (v) => formatNumber(v),
  decimal1: (v) => formatNumber(v, 1),
};

type Point = { date: string } & Record<string, number | string>;

export function TimeSeriesChart<T extends Point>({
  title,
  data,
  metricKey,
  format,
  variant = "area",
  color = "var(--color-primary)",
}: {
  title: string;
  data: T[];
  metricKey: keyof T & string;
  format: ChartFormat;
  variant?: ChartVariant;
  color?: string;
}) {
  const gradientId = `grad-${metricKey}`;
  const formatter = FORMATTERS[format];

  const xAxis = (
    <XAxis
      dataKey="date"
      tickFormatter={(d) => formatDate(d).replace(".", "")}
      tick={{ fontSize: 11, fill: "var(--color-muted)" }}
      axisLine={false}
      tickLine={false}
      minTickGap={24}
    />
  );
  const yAxis = (
    <YAxis
      tick={{ fontSize: 11, fill: "var(--color-muted)" }}
      axisLine={false}
      tickLine={false}
      width={56}
      tickFormatter={(v) => formatter(v)}
    />
  );
  const grid = <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />;
  const tooltip = (
    <Tooltip
      contentStyle={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: 12,
        fontSize: 12,
      }}
      cursor={{ fill: "var(--color-surface-2)", opacity: variant === "bar" ? 1 : 0.5 }}
      labelFormatter={(d) => formatDate(d as string)}
      formatter={(v) => [formatter(Number(v)), METRIC_LABEL[metricKey] ?? title]}
    />
  );
  const margin = { top: 8, right: 16, left: 0, bottom: 0 };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="pl-1">
        {data.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-muted">
            Sem dados no período selecionado.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            {variant === "line" ? (
              <LineChart data={data} margin={margin}>
                {grid}
                {xAxis}
                {yAxis}
                {tooltip}
                <Line
                  type="monotone"
                  dataKey={metricKey as string}
                  stroke={color}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            ) : variant === "bar" ? (
              <BarChart data={data} margin={margin}>
                {grid}
                {xAxis}
                {yAxis}
                {tooltip}
                <Bar dataKey={metricKey as string} fill={color} radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            ) : (
              <AreaChart data={data} margin={margin}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                {grid}
                {xAxis}
                {yAxis}
                {tooltip}
                <Area
                  type="monotone"
                  dataKey={metricKey as string}
                  stroke={color}
                  fill={`url(#${gradientId})`}
                  strokeWidth={2}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
