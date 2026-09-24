import { ListChecks, CheckCircle2, AlarmClockOff, Clock, Users2, Timer } from "lucide-react";
import { EkyteWeekChart } from "@/components/ekyte/ekyte-week-chart";
import { EkyteWorkloadChart } from "@/components/ekyte/ekyte-workload-chart";
import { EkyteRankList } from "@/components/ekyte/ekyte-rank-list";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  ekyteRangeFromParams,
  ekytePreviousPeriod,
  filterEkyteTasks,
  filterEkyteTime,
  ekyteWeeklyAgg,
  ekyteClientAgg,
  ekyteFormatAgg,
  ekyteExecAgg,
  ekyteFmtHours,
  isEkyteOverdue,
} from "@/lib/data/ekyte";

export async function EkyteDashboardSection({ params }: { params: { period?: string; from?: string; to?: string } }) {
  const range = ekyteRangeFromParams(params);
  const prevRange = ekytePreviousPeriod(range);

  const [tasks, time, prevTasks, prevTime] = await Promise.all([
    filterEkyteTasks(range),
    filterEkyteTime(range),
    filterEkyteTasks(prevRange),
    filterEkyteTime(prevRange),
  ]);

  const done = tasks.filter((t) => t.situation === 30).length;
  const openN = tasks.filter((t) => t.situation === 10 || t.situation === 20).length;
  const late = tasks.filter(isEkyteOverdue).length;
  const minutes = time.reduce((a, b) => a + b.minutes, 0);
  const clients = new Set(tasks.map((t) => t.client)).size;

  const prevDone = prevTasks.filter((t) => t.situation === 30).length;
  const prevOpenN = prevTasks.filter((t) => t.situation === 10 || t.situation === 20).length;
  const prevLate = prevTasks.filter(isEkyteOverdue).length;
  const prevMinutes = prevTime.reduce((a, b) => a + b.minutes, 0);
  const prevClients = new Set(prevTasks.map((t) => t.client)).size;

  const weekly = ekyteWeeklyAgg(tasks);
  const clientAgg = ekyteClientAgg(tasks);
  const formatAgg = ekyteFormatAgg(tasks);
  const execAgg = ekyteExecAgg(tasks, time).slice(0, 8);

  return (
    <div>
      <p className="mb-3 text-xs text-muted-2">
        "Concluídas" e "Atrasadas" contam pela <strong>data de vencimento</strong> da tarefa, não pela data em que
        foi finalizada — uma tarefa resolvida fora do período selecionado não entra na contagem de concluídas dele.
      </p>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Tarefas no período" value={tasks.length} previousValue={prevTasks.length} icon={ListChecks} formatter={(v) => v.toFixed(0)} />
        <StatCard label="Concluídas" value={done} previousValue={prevDone} icon={CheckCircle2} formatter={(v) => v.toFixed(0)} />
        <StatCard label="Em aberto" value={openN} previousValue={prevOpenN} icon={Clock} formatter={(v) => v.toFixed(0)} />
        <StatCard label="Atrasadas" value={late} previousValue={prevLate} icon={AlarmClockOff} formatter={(v) => v.toFixed(0)} invertDelta />
        <StatCard label="Horas apontadas" value={minutes / 60} previousValue={prevMinutes / 60} icon={Timer} formatter={(v) => `${ekyteFmtHours(v * 60)}h`} />
        <StatCard label="Clientes atendidos" value={clients} previousValue={prevClients} icon={Users2} formatter={(v) => v.toFixed(0)} />
      </div>

      <div className="mt-6">
        <EkyteWeekChart data={weekly} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <EkyteRankList title="Top clientes" data={clientAgg.slice(0, 8)} color="var(--color-primary)" />
        <EkyteRankList title="Por formato" data={formatAgg.slice(0, 8)} color="var(--color-chart-orange)" />
      </div>

      <div className="mt-6">
        <EkyteWorkloadChart rows={execAgg} />
      </div>

      <p className="mt-2 text-[11px] text-muted-2">
        {formatAgg.length} formatos distintos no período · dados pulled do Ekyte via MCP, não uma sincronização ao vivo.
      </p>
    </div>
  );
}
