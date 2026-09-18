import { FileDown, Presentation, Wallet, Target, Gauge, TrendingUp } from "lucide-react";
import { requireModule } from "@/lib/session";
import { resolveScope } from "@/lib/scope";
import { presetToRange } from "@/lib/data/metrics";
import { getReportData } from "@/lib/reports/data";
import { buildNarrative } from "@/lib/reports/narrative";
import { PageHeader } from "@/components/layout/page-header";
import { FiltersBar } from "@/components/layout/filters-bar";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataSourceBadge } from "@/components/dashboard/badges";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatBRL, formatNumber, formatDate } from "@/lib/utils";

export default async function RelatorioPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; clientId?: string }>;
}) {
  const user = await requireModule("relatorio");
  const params = await searchParams;
  const scope = resolveScope(user, params.clientId);
  const period = params.period ?? "30d";
  const range = presetToRange(period);

  return (
    <div>
      <PageHeader
        title="Relatório"
        description="Gere um relatório em PDF ou uma apresentação em PPT com o padrão visual V4 Company"
        actions={<FiltersBar showPlatform={false} />}
      />

      {!scope.clientId ? (
        <Card className="p-10 text-center text-sm text-muted">
          Selecione um cliente específico no topo da página para gerar o relatório dele.
        </Card>
      ) : (
        <ReportPreview clientId={scope.clientId} range={range} period={period} />
      )}
    </div>
  );
}

async function ReportPreview({
  clientId,
  range,
  period,
}: {
  clientId: string;
  range: { start: Date; end: Date };
  period: string;
}) {
  const data = await getReportData(clientId, range);
  if (!data) {
    return <Card className="p-10 text-center text-sm text-muted">Cliente não encontrado.</Card>;
  }

  const narrative = buildNarrative(data);
  const pdfHref = `/api/relatorio/pdf?clientId=${clientId}&period=${period}`;
  const pptxHref = `/api/relatorio/pptx?clientId=${clientId}&period=${period}`;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>{data.client.company}</CardTitle>
            <CardDescription>
              {formatDate(data.range.start)} a {formatDate(data.range.end)} · <DataSourceBadge dataSource={data.dataSource} />
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <a href={pdfHref} download>
                <FileDown className="size-4" /> Baixar PDF
              </a>
            </Button>
            <Button asChild>
              <a href={pptxHref} download>
                <Presentation className="size-4" /> Baixar PPT
              </a>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard label="Investimento" value={data.current.costBrl} icon={Wallet} formatter={formatBRL} />
            <StatCard label="Conversões" value={data.current.conversions} icon={Target} formatter={(v) => formatNumber(v, 1)} />
            <StatCard label="CPA" value={data.current.cpa} icon={Gauge} formatter={formatBRL} invertDelta />
            <StatCard label="ROAS" value={data.current.roas} icon={TrendingUp} formatter={(v) => `${v.toFixed(2)}x`} />
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-black bg-black text-white dark:border-l-primary">
        <CardHeader>
          <CardTitle className="text-white">Leitura executiva</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-white/80">{narrative.leituraExecutiva}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Destaques do período</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {narrative.destaques.map((d, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
              {d}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Próximos passos</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {narrative.proximosPassos.map((step, i) => (
            <div key={i} className="rounded-lg border border-border p-3">
              <div className="mb-1.5 flex items-center gap-2">
                <span className={`size-1.5 rounded-full ${i % 2 === 0 ? "bg-primary" : "bg-foreground"}`} />
                <span className="text-sm font-semibold">{step.title}</span>
              </div>
              <p className="text-xs text-muted">{step.description}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
