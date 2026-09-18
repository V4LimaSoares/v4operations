import { Wallet, Eye, MousePointerClick, Percent, Target, TrendingUp, Gauge } from "lucide-react";
import { requireModule } from "@/lib/session";
import { resolveScope } from "@/lib/scope";
import { prisma } from "@/lib/prisma";
import { presetToRange, getSummaryWithComparison, getDailyTimeSeries, getCampaignPerformance } from "@/lib/data/metrics";
import { getKeywordPerformance } from "@/lib/data/adgroups";
import { getSearchTerms } from "@/lib/data/search-terms";
import { getFunnelData } from "@/lib/data/funnel";
import { PageHeader } from "@/components/layout/page-header";
import { FiltersBar } from "@/components/layout/filters-bar";
import { StatCard } from "@/components/dashboard/stat-card";
import { TimeSeriesChart } from "@/components/dashboard/time-series-chart";
import { FunnelChart } from "@/components/dashboard/funnel-chart";
import { StatusBadge, DataSourceBadge, SearchTermStatusBadge } from "@/components/dashboard/badges";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatBRL, formatNumber, formatPercent, formatDate } from "@/lib/utils";

export default async function GoogleAdsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; clientId?: string }>;
}) {
  const user = await requireModule("google_ads");
  const params = await searchParams;
  const scope = resolveScope(user, params.clientId);
  const range = presetToRange(params.period ?? "30d");

  const [{ current, previous }, series, campaigns, keywords, searchTerms, funnel, accounts] = await Promise.all([
    getSummaryWithComparison(scope, range, "GOOGLE_ADS"),
    getDailyTimeSeries(scope, range, "GOOGLE_ADS"),
    getCampaignPerformance(scope, range, "GOOGLE_ADS"),
    getKeywordPerformance(scope, range),
    getSearchTerms(scope),
    scope.clientId ? getFunnelData(scope) : Promise.resolve(null),
    prisma.adAccount.findMany({
      where: { platform: "GOOGLE_ADS", clientId: scope.clientId ?? undefined },
      select: { id: true, name: true, externalId: true, dataSource: true, status: true, lastSyncAt: true, client: { select: { name: true } } },
    }),
  ]);

  const topKeywords = keywords.slice(0, 10);
  const topSearchTerms = searchTerms.slice(0, 15);
  const searchTermsPeriod = searchTerms[0];
  const best = [...campaigns].sort((a, b) => b.roas - a.roas)[0];
  const worst = [...campaigns].filter((c) => c.costBrl > 0).sort((a, b) => a.roas - b.roas)[0];

  return (
    <div>
      <PageHeader title="Google Ads" description="Performance consolidada das contas de Google Ads" actions={<FiltersBar showPlatform={false} />} />

      {accounts.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted">
          Nenhuma conta de Google Ads conectada{scope.clientId ? " para este cliente" : ""} ainda.
        </Card>
      ) : (
        <>
          <div className="mb-6 flex flex-wrap gap-2">
            {accounts.map((a) => (
              <Badge key={a.id} variant="outline" className="gap-1.5">
                {a.name} · {a.externalId}
                <DataSourceBadge dataSource={a.dataSource} />
              </Badge>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            <StatCard label="Investimento" value={current.costBrl} previousValue={previous.costBrl} icon={Wallet} formatter={formatBRL} />
            <StatCard label="Impressões" value={current.impressions} previousValue={previous.impressions} icon={Eye} formatter={(v) => formatNumber(v)} />
            <StatCard label="Cliques" value={current.clicks} previousValue={previous.clicks} icon={MousePointerClick} formatter={(v) => formatNumber(v)} />
            <StatCard label="CTR" value={current.ctr} previousValue={previous.ctr} icon={Percent} formatter={(v) => formatPercent(v)} />
            <StatCard label="CPC" value={current.cpc} previousValue={previous.cpc} icon={Gauge} formatter={formatBRL} invertDelta />
            <StatCard label="CPM" value={current.cpm} previousValue={previous.cpm} icon={Gauge} formatter={formatBRL} invertDelta />
            <StatCard label="Conversões" value={current.conversions} previousValue={previous.conversions} icon={Target} formatter={(v) => formatNumber(v, 1)} />
            <StatCard label="CPA" value={current.cpa} previousValue={previous.cpa} icon={Gauge} formatter={formatBRL} invertDelta />
            <StatCard label="Faturamento" value={current.conversionValueBrl} previousValue={previous.conversionValueBrl} icon={TrendingUp} formatter={formatBRL} />
            <StatCard label="ROAS" value={current.roas} previousValue={previous.roas} icon={TrendingUp} formatter={(v) => `${v.toFixed(2)}x`} />
          </div>

          {funnel ? (
            <div className="mt-6">
              <FunnelChart data={funnel} />
            </div>
          ) : (
            !scope.clientId && (
              <Card className="mt-6 p-4 text-sm text-muted">
                Selecione um cliente específico no topo da página para ver o funil de conversão — cada
                cliente costuma ter etapas diferentes (ex: Leads → Agendamentos → Vendas), então não faz
                sentido somar etapas de clientes diferentes na visão agregada.
              </Card>
            )
          )}

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <TimeSeriesChart title="Investimento" data={series} metricKey="costBrl" format="brl" color="var(--color-google)" />
            <TimeSeriesChart title="Conversões" data={series} metricKey="conversions" format="decimal1" color="var(--color-info)" />
          </div>

          {(best || worst) && (
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              {best && (
                <Card className="p-5">
                  <p className="text-xs font-medium uppercase text-positive">Melhor desempenho</p>
                  <p className="mt-1 font-semibold">{best.name}</p>
                  <p className="text-sm text-muted">ROAS {best.roas.toFixed(2)}x · {formatBRL(best.costBrl)} investidos</p>
                </Card>
              )}
              {worst && (
                <Card className="p-5">
                  <p className="text-xs font-medium uppercase text-negative">Pior desempenho</p>
                  <p className="mt-1 font-semibold">{worst.name}</p>
                  <p className="text-sm text-muted">ROAS {worst.roas.toFixed(2)}x · {formatBRL(worst.costBrl)} investidos</p>
                </Card>
              )}
            </div>
          )}

          <Card className="mt-6">
            <CardHeader><CardTitle>Campanhas</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campanha</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Orçamento diário</TableHead>
                    <TableHead className="text-right">Investimento</TableHead>
                    <TableHead className="text-right">Impressões</TableHead>
                    <TableHead className="text-right">Cliques</TableHead>
                    <TableHead className="text-right">CTR</TableHead>
                    <TableHead className="text-right">Conversões</TableHead>
                    <TableHead className="text-right">ROAS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell><StatusBadge status={c.status} /></TableCell>
                      <TableCell className="text-right tabular-nums">{c.budgetDailyBrl ? formatBRL(c.budgetDailyBrl) : "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatBRL(c.costBrl)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatNumber(c.impressions)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatNumber(c.clicks)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatPercent(c.ctr)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatNumber(c.conversions, 1)}</TableCell>
                      <TableCell className="text-right tabular-nums">{c.roas.toFixed(2)}x</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader><CardTitle>Principais palavras-chave</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Palavra-chave</TableHead>
                    <TableHead>Correspondência</TableHead>
                    <TableHead className="text-right">Quality Score</TableHead>
                    <TableHead className="text-right">Cliques</TableHead>
                    <TableHead className="text-right">CPC</TableHead>
                    <TableHead className="text-right">Investimento</TableHead>
                    <TableHead className="text-right">Conversões</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topKeywords.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted">Sem palavras-chave no período.</TableCell></TableRow>
                  )}
                  {topKeywords.map((k) => (
                    <TableRow key={k.id}>
                      <TableCell className="font-medium">{k.text}</TableCell>
                      <TableCell className="text-muted">{k.matchType}</TableCell>
                      <TableCell className="text-right tabular-nums">{k.qualityScore ?? "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatNumber(k.clicks)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatBRL(k.cpc)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatBRL(k.costBrl)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatNumber(k.conversions, 1)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Termos de pesquisa</CardTitle>
              <p className="text-xs text-muted">
                {searchTermsPeriod
                  ? `Período sincronizado: ${formatDate(searchTermsPeriod.periodStart)} a ${formatDate(searchTermsPeriod.periodEnd)}`
                  : "Nenhum termo de pesquisa sincronizado ainda."}
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Termo pesquisado</TableHead>
                    <TableHead>Campanha</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Impressões</TableHead>
                    <TableHead className="text-right">Cliques</TableHead>
                    <TableHead className="text-right">CTR</TableHead>
                    <TableHead className="text-right">CPC</TableHead>
                    <TableHead className="text-right">Custo</TableHead>
                    <TableHead className="text-right">Conversões</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topSearchTerms.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="py-8 text-center text-muted">
                        Sem termos de pesquisa sincronizados. Peça ao Claude Code para rodar a sincronização via MCP.
                      </TableCell>
                    </TableRow>
                  )}
                  {topSearchTerms.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.text}</TableCell>
                      <TableCell className="text-muted">{t.campaignName}</TableCell>
                      <TableCell><SearchTermStatusBadge status={t.status} /></TableCell>
                      <TableCell className="text-right tabular-nums">{formatNumber(t.impressions)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatNumber(t.clicks)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatPercent(t.ctr)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatBRL(t.cpc)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatBRL(t.costBrl)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatNumber(t.conversions, 1)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
