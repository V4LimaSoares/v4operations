"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ekyteFmtDateShort, type WeekAggRow } from "@/lib/data/ekyte";

const SERIES = [
  { key: "done", label: "Concluída", color: "var(--color-positive)" },
  { key: "open", label: "Em aberto", color: "var(--color-muted-2)" },
  { key: "late", label: "Atrasada", color: "var(--color-negative)" },
] as const;

export function EkyteWeekChart({ data }: { data: WeekAggRow[] }) {
  const rows = data.map((d) => ({ ...d, weekLabel: ekyteFmtDateShort(d.weekStart) }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Volume por semana</CardTitle>
      </CardHeader>
      <CardContent className="pl-1">
        {rows.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-muted">Sem tarefas no período selecionado.</div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={rows} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="weekLabel"
                tick={{ fontSize: 11, fill: "var(--color-muted)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis tick={{ fontSize: 11, fill: "var(--color-muted)" }} axisLine={false} tickLine={false} width={32} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }}
                labelFormatter={(l) => `Semana de ${l}`}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(value) => <span style={{ color: "var(--color-muted)", fontSize: 12 }}>{value}</span>}
              />
              {SERIES.map((s) => (
                <Bar key={s.key} dataKey={s.key} name={s.label} stackId="w" fill={s.color} maxBarSize={28} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
