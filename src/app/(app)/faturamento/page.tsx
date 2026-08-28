import { Wallet, Receipt, TrendingUp, Ticket } from "lucide-react";
import { requireUser } from "@/lib/session";
import { resolveScope } from "@/lib/scope";
import { presetToRange, getSummaryWithComparison } from "@/lib/data/metrics";
import { listRevenueEntries, getRevenueSeries } from "@/lib/data/revenue";
import { PageHeader } from "@/components/layout/page-header";
import { FiltersBar } from "@/components/layout/filters-bar";
import { StatCard } from "@/components/dashboard/stat-card";
import { TimeSeriesChart } from "@/components/dashboard/time-series-chart";
import { RevenueForm } from "@/components/dashboard/revenue-form";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatBRL, formatDate } from "@/lib/utils";

export default async function FaturamentoPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; clientId?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const scope = resolveScope(user, params.clientId);
  const range = presetToRange(params.period ?? "30d");

  const [{ current, previous }, entries, series] = await Promise.all([
    getSummaryWithComparison(scope, range, "all"),
    listRevenueEntries(scope, range),
    getRevenueSeries(scope, range),
  ]);

  return (
    <div>
      <PageHeader
        title="Faturamento"
        description="Investimento em mídia vs. receita real do negócio"
        actions={
          <>
            <FiltersBar showPlatform={false} />
            {scope.clientId && <RevenueForm clientId={scope.clientId} />}
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Investimento em mídia" value={current.costBrl} previousValue={previous.costBrl} icon={Wallet} formatter={formatBRL} />
        <StatCard label="Faturamento" value={current.revenueBrl} previousValue={previous.revenueBrl} icon={Receipt} formatter={formatBRL} />
        <StatCard label="ROAS" value={current.roas} previousValue={previous.roas} icon={TrendingUp} formatter={(v) => `${v.toFixed(2)}x`} />
        <StatCard label="Ticket médio" value={current.avgTicket} previousValue={previous.avgTicket} icon={Ticket} formatter={formatBRL} />
      </div>

      <div className="mt-6">
        <TimeSeriesChart title="Faturamento registrado ao longo do tempo" data={series} metricKey="amountBrl" format="brl" color="var(--color-positive)" />
      </div>

      {!scope.clientId && (
        <Card className="mt-6 p-4 text-sm text-muted">
          Selecione um cliente específico no topo da página para registrar novos lançamentos de faturamento.
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader><CardTitle>Lançamentos</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                {scope.isAggregate && <TableHead>Cliente</TableHead>}
                <TableHead>Origem</TableHead>
                <TableHead>Observações</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted">
                    Nenhum lançamento de faturamento no período. As APIs de anúncios não reportam receita real —
                    cadastre manualmente para ver ROAS e ticket médio com base na receita da empresa.
                  </TableCell>
                </TableRow>
              )}
              {entries.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>{formatDate(e.date)}</TableCell>
                  {scope.isAggregate && <TableCell className="text-muted">{e.client.name}</TableCell>}
                  <TableCell className="text-muted">{e.source === "MANUAL" ? "Manual" : "Integração"}</TableCell>
                  <TableCell className="text-muted">{e.notes ?? "—"}</TableCell>
                  <TableCell className="text-right tabular-nums font-medium">{formatBRL(e.amountBrl.toString())}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
