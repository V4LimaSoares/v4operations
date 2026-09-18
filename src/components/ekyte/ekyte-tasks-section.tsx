import { EkyteTaskFilters } from "@/components/ekyte/ekyte-task-filters";
import { EkyteStatusBadge } from "@/components/ekyte/badges";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import {
  ekyteRangeFromParams,
  filterEkyteTasks,
  filterEkyteTime,
  ekyteFormatBucket,
  ekyteFmtMinutes,
  ekyteFmtHours,
  ekyteFmtDateShort,
  isEkyteOverdue,
  getEkyteSnapshot,
} from "@/lib/data/ekyte";
import { ListChecks, Users2, Layers, Clock3, Timer, Ticket } from "lucide-react";
import { formatDate } from "@/lib/utils";

export async function EkyteTasksSection({
  params,
}: {
  params: { period?: string; from?: string; to?: string; client?: string; format?: string; status?: string; q?: string };
}) {
  const range = ekyteRangeFromParams(params);

  const [inRange, time, snapshot] = await Promise.all([filterEkyteTasks(range), filterEkyteTime(range), getEkyteSnapshot()]);
  const loggedByTask = new Map<number, number>();
  for (const t of time) loggedByTask.set(t.taskId, (loggedByTask.get(t.taskId) ?? 0) + t.minutes);

  const clientsList = [...new Set(inRange.map((t) => t.client))].sort();
  const formatsList = [...new Set(inRange.map((t) => ekyteFormatBucket(t.type)))].sort();

  const q = (params.q ?? "").toLowerCase().trim();
  const rows = inRange
    .filter((t) => !params.client || t.client === params.client)
    .filter((t) => !params.format || ekyteFormatBucket(t.type) === params.format)
    .filter((t) => {
      if (!params.status) return true;
      if (params.status === "late") return isEkyteOverdue(t);
      return String(t.situation) === params.status;
    })
    .filter((t) => !q || `${t.client} ${t.type} ${t.executor} ${t.phase}`.toLowerCase().includes(q))
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .map((t) => ({ ...t, bucket: ekyteFormatBucket(t.type), logged: loggedByTask.get(t.id) ?? 0 }));

  const totalEst = inRange.reduce((a, b) => a + b.est, 0);
  const totalLogged = time.reduce((a, b) => a + b.minutes, 0);

  const byFormat = new Map<string, { n: number; est: number; logged: number }>();
  for (const t of inRange) {
    const b = ekyteFormatBucket(t.type);
    const cur = byFormat.get(b) ?? { n: 0, est: 0, logged: 0 };
    cur.n += 1;
    cur.est += t.est;
    cur.logged += loggedByTask.get(t.id) ?? 0;
    byFormat.set(b, cur);
  }
  const formatTimeRows = [...byFormat.entries()]
    .map(([bucket, v]) => ({ bucket, ...v }))
    .sort((a, b) => b.n - a.n);

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Tarefas no período" value={inRange.length} icon={ListChecks} formatter={(v) => v.toFixed(0)} />
        <StatCard label="Clientes atendidos" value={clientsList.length} icon={Users2} formatter={(v) => v.toFixed(0)} />
        <StatCard label="Formatos distintos" value={formatsList.length} icon={Layers} formatter={(v) => v.toFixed(0)} />
        <StatCard label="Tempo estimado total" value={totalEst / 60} icon={Clock3} formatter={(v) => `${ekyteFmtHours(v * 60)}h`} />
        <StatCard label="Tempo apontado total" value={totalLogged / 60} icon={Timer} formatter={(v) => `${ekyteFmtHours(v * 60)}h`} />
        <StatCard label="Ticket médio estimado" value={inRange.length ? totalEst / inRange.length : 0} icon={Ticket} formatter={(v) => ekyteFmtMinutes(v)} />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Tempo por formato</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Formato</TableHead>
                <TableHead className="text-right">Qtde</TableHead>
                <TableHead className="text-right">Est. médio</TableHead>
                <TableHead className="text-right">Apontado total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {formatTimeRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-muted">
                    Sem dados no período selecionado.
                  </TableCell>
                </TableRow>
              )}
              {formatTimeRows.map((r) => (
                <TableRow key={r.bucket}>
                  <TableCell className="font-medium">{r.bucket}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.n}</TableCell>
                  <TableCell className="text-right tabular-nums">{ekyteFmtMinutes(r.est / r.n)}</TableCell>
                  <TableCell className="text-right tabular-nums">{ekyteFmtHours(r.logged)}h</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="mt-6 mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">
          Todas as tarefas <span className="font-normal text-muted">· {rows.length} no período</span>
        </h2>
        <EkyteTaskFilters clients={clientsList} formats={formatsList} />
      </div>

      <Card>
        <CardContent className="max-h-[560px] overflow-y-auto p-0 scrollbar-thin">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vencimento</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Formato</TableHead>
                <TableHead>Tarefa</TableHead>
                <TableHead>Executor</TableHead>
                <TableHead>Etapa</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Estimado</TableHead>
                <TableHead className="text-right">Apontado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="py-10 text-center text-muted">
                    Nenhuma tarefa encontrada com esses filtros.
                  </TableCell>
                </TableRow>
              )}
              {rows.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="tabular-nums">{ekyteFmtDateShort(t.date)}</TableCell>
                  <TableCell>{t.client}</TableCell>
                  <TableCell className="text-muted">{t.bucket}</TableCell>
                  <TableCell className="max-w-[260px] truncate" title={t.type}>
                    {t.type}
                  </TableCell>
                  <TableCell>{t.executor}</TableCell>
                  <TableCell className="text-muted">{t.phase}</TableCell>
                  <TableCell>
                    <EkyteStatusBadge task={t} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{ekyteFmtMinutes(t.est)}</TableCell>
                  <TableCell className="text-right tabular-nums">{ekyteFmtMinutes(t.logged)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <p className="mt-2 text-[11px] text-muted-2">
        Base total pulled do Ekyte: {snapshot.tasks.length} tarefas · atualizado em {formatDate(snapshot.generatedAt)}.
      </p>
    </div>
  );
}
