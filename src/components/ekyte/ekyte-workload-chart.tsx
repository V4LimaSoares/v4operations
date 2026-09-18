"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { ExecAggRow } from "@/lib/data/ekyte";

export function EkyteWorkloadChart({ rows }: { rows: ExecAggRow[] }) {
  const data = rows.map((r) => ({ name: r.name, "Ativa / atrasada": r.active + r.late, Concluída: r.done }));
  const height = Math.max(180, data.length * 56);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Carga por pessoa</CardTitle>
      </CardHeader>
      <CardContent className="pl-1">
        {data.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-sm text-muted">Sem execuções no período selecionado.</div>
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 0 }} barCategoryGap={18}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "var(--color-muted)" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12, fill: "var(--color-foreground)" }}
                axisLine={false}
                tickLine={false}
                width={120}
              />
              <Tooltip
                contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }}
                cursor={{ fill: "var(--color-surface-2)" }}
              />
              <Legend iconType="circle" iconSize={8} formatter={(value) => <span style={{ color: "var(--color-muted)", fontSize: 12 }}>{value}</span>} />
              <Bar dataKey="Ativa / atrasada" fill="var(--color-primary)" radius={[0, 4, 4, 0]} maxBarSize={16} />
              <Bar dataKey="Concluída" fill="var(--color-positive)" radius={[0, 4, 4, 0]} maxBarSize={16} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
