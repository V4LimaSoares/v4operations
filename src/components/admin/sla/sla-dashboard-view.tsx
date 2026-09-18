import { Users, Clock, MessageSquare, AlertTriangle, Siren } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { TimeSeriesChart } from "@/components/dashboard/time-series-chart";
import { DonutChart } from "@/components/dashboard/donut-chart";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { SlaDashboardFilters } from "@/components/admin/sla/sla-dashboard-filters";
import { TEAM, lastBusinessDays, clientLabel, type AttendanceData, type SlaGroup, type MonitorData } from "@/lib/data/sla";
import { slaPeriodToCalendarRange, slaBusinessDaySliceCount, isSlaDateInRange, parseSlaDate } from "@/lib/sla-dashboard";

export function SlaDashboardView({
  groups,
  attendance,
  monitor,
  period,
  client,
  from,
  to,
}: {
  groups: SlaGroup[] | null;
  attendance: AttendanceData | null;
  monitor: MonitorData | null;
  period: string;
  client: string;
  from?: string;
  to?: string;
}) {
  const clientNames = (groups?.map((g) => g.name) ?? Object.keys(attendance?.clients ?? {})).sort((a, b) =>
    clientLabel(a).localeCompare(clientLabel(b))
  );
  const calendarRange = slaPeriodToCalendarRange(period, from, to);
  const selectedLabel = client ? clientLabel(client) : null;

  // --- Company-wide daily series (response time + volume), summed/weighted across the team.
  // Not filterable by client: the automation aggregates these per person, not per WhatsApp group.
  const dayMap = new Map<string, { volume: number; weightedResp: number }>();
  for (const person of Object.values(TEAM)) {
    const stats = attendance?.team[person.key];
    if (!stats) continue;
    const dates = lastBusinessDays(stats.responseMin.length);
    const n = slaBusinessDaySliceCount(period, dates.length, from, to);
    const slicedDates = dates.slice(-n);
    const slicedVolume = stats.volume.slice(-n);
    const slicedResp = stats.responseMin.slice(-n);
    slicedDates.forEach((date, i) => {
      const v = slicedVolume[i] ?? 0;
      const r = slicedResp[i] ?? 0;
      const cur = dayMap.get(date) ?? { volume: 0, weightedResp: 0 };
      cur.volume += v;
      cur.weightedResp += v * r;
      dayMap.set(date, cur);
    });
  }
  const days = [...dayMap.keys()].sort();
  const responseSeries = days.map((date) => {
    const d = dayMap.get(date)!;
    return { date, minutos: d.volume ? Math.round(d.weightedResp / d.volume) : 0 };
  });
  const volumeSeries = days.map((date) => ({ date, atendimentos: dayMap.get(date)!.volume }));
  const totalAtendimentos = days.reduce((a, date) => a + dayMap.get(date)!.volume, 0);
  const avgResponse = days.length
    ? Math.round(days.reduce((a, date) => a + dayMap.get(date)!.weightedResp, 0) / Math.max(1, totalAtendimentos))
    : 0;

  // --- Atendimentos por pessoa no período (same date window as above, still company-wide).
  const byPerson = Object.values(TEAM).map((person) => {
    const stats = attendance?.team[person.key];
    const dates = stats ? lastBusinessDays(stats.responseMin.length) : [];
    const n = stats ? slaBusinessDaySliceCount(period, dates.length, from, to) : 0;
    const volume = stats ? stats.volume.slice(-n).reduce((a, b) => a + b, 0) : 0;
    return { name: person.name.split(" ")[0], value: volume, color: person.colorVar };
  });

  // --- Historical alerts, combined across the team — the one KPI/table that genuinely respects
  // both filters, since each entry carries its own group name and date.
  type AlertRow = { date: string; time: string; group: string; kind: string; wait: string; status: string; person: string; color: string };
  const allAlerts: AlertRow[] = [];
  for (const person of Object.values(TEAM)) {
    const stats = attendance?.team[person.key];
    if (!stats) continue;
    for (const a of stats.alertsLog) {
      allAlerts.push({ ...a, person: person.name.split(" ")[0], color: person.colorVar });
    }
  }
  const filteredAlerts = allAlerts
    .filter((a) => isSlaDateInRange(a.date, calendarRange))
    .filter((a) => !selectedLabel || a.group === selectedLabel)
    .sort((a, b) => {
      const da = parseSlaDate(a.date)?.getTime() ?? 0;
      const db = parseSlaDate(b.date)?.getTime() ?? 0;
      return db - da || a.time.localeCompare(b.time) * -1;
    });

  // --- Live "open right now" alerts from the monitor — client-filterable, not period-filterable
  // (they're current state, not history).
  const liveAttention = (monitor?.attention ?? []).filter((m) => !selectedLabel || m.group === selectedLabel);
  const liveUrgent = (monitor?.urgent ?? []).filter((m) => !selectedLabel || m.group === selectedLabel);

  const groupCount = client ? (clientNames.includes(client) ? 1 : 0) : clientNames.length;

  return (
    <div>
      <div className="mb-5">
        <SlaDashboardFilters clients={clientNames} />
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Atendimentos no período" value={totalAtendimentos} icon={MessageSquare} formatter={(v) => String(v)} />
        <StatCard label="Tempo médio de resposta" value={avgResponse} icon={Clock} formatter={(v) => `${v}min`} />
        <StatCard label="Alertas no período" value={filteredAlerts.length} icon={AlertTriangle} formatter={(v) => String(v)} />
        <StatCard
          label={client ? "Cliente selecionado" : "Grupos monitorados"}
          value={groupCount}
          icon={Users}
          formatter={(v) => (client ? selectedLabel ?? "—" : String(v))}
        />
      </div>

      {(liveAttention.length > 0 || liveUrgent.length > 0) && (
        <Card className="mt-4 flex items-start gap-3 border-negative/30 bg-negative-soft p-4">
          <Siren className="size-4.5 shrink-0 text-negative" />
          <div className="text-xs leading-relaxed text-foreground">
            <span className="font-semibold">
              {liveUrgent.length + liveAttention.length} alerta{liveUrgent.length + liveAttention.length === 1 ? "" : "s"} em aberto agora
            </span>
            {selectedLabel ? ` para ${selectedLabel}` : ""} — {liveUrgent.length} urgente(s), {liveAttention.length} ponto(s) de atenção.
          </div>
        </Card>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TimeSeriesChart
          title="Tempo médio de resposta por dia (equipe)"
          data={responseSeries}
          metricKey="minutos"
          format="number"
          variant="line"
          color="var(--color-primary)"
        />
        <DonutChart title="Atendimentos por pessoa no período" data={byPerson} format="number" />
      </div>

      <div className="mt-4">
        <TimeSeriesChart
          title="Atendimentos por dia (equipe)"
          data={volumeSeries}
          metricKey="atendimentos"
          format="number"
          variant="bar"
          color="var(--color-chart-orange)"
        />
      </div>

      <p className="mt-3 text-[11px] text-muted-2">
        Tempo médio de resposta e atendimentos são consolidados por pessoa pela automação, não por grupo — por isso o filtro de cliente não
        recorta esses dois gráficos, só a lista de alertas e o grupo monitorado abaixo.
      </p>

      <div className="mt-6 mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          Alertas no período {selectedLabel ? `· ${selectedLabel}` : ""} <span className="font-normal text-muted">({filteredAlerts.length})</span>
        </h3>
      </div>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Pessoa</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Espera</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAlerts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-sm text-muted">
                  Nenhum alerta no período{selectedLabel ? ` para ${selectedLabel}` : ""}.
                </TableCell>
              </TableRow>
            ) : (
              filteredAlerts.slice(0, 50).map((a, i) => (
                <TableRow key={i}>
                  <TableCell className="text-muted">
                    {a.date} {a.time}
                  </TableCell>
                  <TableCell className="font-medium">{a.group}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="size-2 rounded-full" style={{ background: a.color }} />
                      {a.person}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={a.kind === "Urgente" ? "negative" : "warning"}>{a.kind}</Badge>
                  </TableCell>
                  <TableCell className="text-muted">{a.wait}</TableCell>
                  <TableCell className="text-muted">{a.status}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
      {filteredAlerts.length > 50 && (
        <p className="mt-2 text-[11px] text-muted-2">Mostrando os 50 mais recentes de {filteredAlerts.length} alertas no período.</p>
      )}
    </div>
  );
}
