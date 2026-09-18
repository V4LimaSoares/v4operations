import { EkytePrintButton } from "@/components/ekyte/ekyte-print-button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import {
  ekyteRangeFromParams,
  filterEkyteTasks,
  filterEkyteTime,
  ekyteClientDetail,
  ekyteExecAgg,
  ekyteFormatAgg,
  ekyteFindings,
  ekyteFmtHours,
  ekytePct,
  isEkyteOverdue,
  EKYTE_DATA_MIN,
  EKYTE_DATA_MAX,
} from "@/lib/data/ekyte";
import { formatDate } from "@/lib/utils";

export async function EkyteRelatorioSection({ params }: { params: { period?: string; from?: string; to?: string } }) {
  const range = ekyteRangeFromParams(params);

  const [tasks, time] = await Promise.all([filterEkyteTasks(range), filterEkyteTime(range)]);
  const done = tasks.filter((t) => t.situation === 30).length;
  const late = tasks.filter(isEkyteOverdue).length;
  const minutes = time.reduce((a, b) => a + b.minutes, 0);

  const clientDetail = ekyteClientDetail(tasks, time);
  const execAgg = ekyteExecAgg(tasks, time);
  const formatAgg = ekyteFormatAgg(tasks);
  const findings = ekyteFindings(tasks, time);
  const clients = clientDetail.length;
  const formats = formatAgg.length;

  return (
    <div>
      <Card className="print:hidden">
        <CardContent className="flex flex-wrap items-end gap-4 p-5">
          <form className="flex flex-wrap items-end gap-4">
            <div>
              <Label htmlFor="from">Início</Label>
              <Input id="from" name="from" type="date" min={EKYTE_DATA_MIN} max={EKYTE_DATA_MAX} defaultValue={range.start} className="mt-1.5 w-40" />
            </div>
            <div>
              <Label htmlFor="to">Fim</Label>
              <Input id="to" name="to" type="date" min={EKYTE_DATA_MIN} max={EKYTE_DATA_MAX} defaultValue={range.end} className="mt-1.5 w-40" />
            </div>
            <Button type="submit">Gerar relatório do time</Button>
          </form>
        </CardContent>
      </Card>

      <div className="mt-6 flex flex-col gap-6">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Relatório de Operação — Ekyte</CardTitle>
              <CardDescription>
                {formatDate(range.start)} a {formatDate(range.end)} · gerado em {formatDate(new Date())}
              </CardDescription>
            </div>
            <div className="print:hidden">
              <EkytePrintButton />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <Preview label="Tarefas" value={tasks.length.toString()} />
              <Preview label="Concluídas" value={done.toString()} tone="positive" />
              <Preview label="Atrasadas" value={late.toString()} tone="negative" />
              <Preview label="Horas apontadas" value={`${ekyteFmtHours(minutes)}h`} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-black bg-black text-white dark:border-l-primary">
          <CardHeader>
            <CardTitle className="text-white">Resumo executivo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-white/80">
              No período selecionado, a operação registrou {tasks.length} tarefas com vencimento na janela, das quais {done} concluídas
              e {late} em atraso. O time apontou {ekyteFmtHours(minutes)}h em {time.length} lançamentos, atendendo {clients} cliente
              {clients === 1 ? "" : "s"} em {formats} formato{formats === 1 ? "" : "s"} distinto{formats === 1 ? "" : "s"}.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Produção por cliente</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-right">Tarefas</TableHead>
                  <TableHead className="text-right">Concluídas</TableHead>
                  <TableHead className="text-right">Atrasadas</TableHead>
                  <TableHead className="text-right">Horas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientDetail.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted">
                      Sem dados no período selecionado.
                    </TableCell>
                  </TableRow>
                )}
                {clientDetail.map((c) => (
                  <TableRow key={c.client}>
                    <TableCell className="font-medium">{c.client}</TableCell>
                    <TableCell className="text-right tabular-nums">{c.n}</TableCell>
                    <TableCell className="text-right tabular-nums">{c.done}</TableCell>
                    <TableCell className="text-right tabular-nums">{c.late}</TableCell>
                    <TableCell className="text-right tabular-nums">{ekyteFmtHours(c.minutes)}h</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Produção por pessoa</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pessoa</TableHead>
                  <TableHead className="text-right">Tarefas</TableHead>
                  <TableHead className="text-right">Concluídas</TableHead>
                  <TableHead className="text-right">Atrasadas</TableHead>
                  <TableHead className="text-right">Horas</TableHead>
                  <TableHead className="text-right">Conclusão</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {execAgg.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted">
                      Sem dados no período selecionado.
                    </TableCell>
                  </TableRow>
                )}
                {execAgg.map((e) => (
                  <TableRow key={e.name}>
                    <TableCell className="font-medium">{e.name}</TableCell>
                    <TableCell className="text-right tabular-nums">{e.total}</TableCell>
                    <TableCell className="text-right tabular-nums">{e.done}</TableCell>
                    <TableCell className="text-right tabular-nums">{e.late}</TableCell>
                    <TableCell className="text-right tabular-nums">{ekyteFmtHours(e.minutes)}h</TableCell>
                    <TableCell className="text-right tabular-nums">{ekytePct(e.done, e.total)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Produção por formato</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Formato</TableHead>
                  <TableHead className="text-right">Tarefas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {formatAgg.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="py-8 text-center text-muted">
                      Sem dados no período selecionado.
                    </TableCell>
                  </TableRow>
                )}
                {formatAgg.map((f) => (
                  <TableRow key={f.label}>
                    <TableCell className="font-medium">{f.label}</TableCell>
                    <TableCell className="text-right tabular-nums">{f.value}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pontos de atenção</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {findings.length === 0 && <p className="text-sm text-muted">Nada fora do padrão neste período.</p>}
            {findings.map((f, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                {f}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Preview({ label, value, tone }: { label: string; value: string; tone?: "positive" | "negative" }) {
  return (
    <div className="rounded-lg bg-surface-2 p-3">
      <p className="text-xs font-medium uppercase text-muted">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${tone === "positive" ? "text-positive" : tone === "negative" ? "text-negative" : ""}`}>{value}</p>
    </div>
  );
}
