import { Wallet, Eye, MousePointerClick, Percent, Target, TrendingUp, Gauge, Users2, Repeat } from "lucide-react";
import { requireModule } from "@/lib/session";
import { resolveScope } from "@/lib/scope";
import { prisma } from "@/lib/prisma";
import { presetToRange, getSummaryWithComparison, getDailyTimeSeries, getCampaignPerformance } from "@/lib/data/metrics";
import { getAdGroupPerformance } from "@/lib/data/adgroups";
import { PageHeader } from "@/components/layout/page-header";
import { FiltersBar } from "@/components/layout/filters-bar";
import { StatCard } from "@/components/dashboard/stat-card";
import { TimeSeriesChart } from "@/components/dashboard/time-series-chart";
import { StatusBadge, DataSourceBadge } from "@/components/dashboard/badges";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatBRL, formatNumber, formatPercent } from "@/lib/utils";

export default async function MetaAdsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; clientId?: string }>;
}) {
  const user = await requireModule("meta_ads");
  const params = await searchParams;
  const scope = resolveScope(user, params.clientId);
  const range = presetToRange(params.period ?? "30d");

  const [{ current, previous }, series, campaigns, adSets, accounts] = await Promise.all([
    getSummaryWithComparison(scope, range, "META_ADS"),
    getDailyTimeSeries(scope, range, "META_ADS"),
    getCampaignPerformance(scope, range, "META_ADS"),
    getAdGroupPerformance(scope, range, "META_ADS"),
    prisma.adAccount.findMany({
      where: { platform: "META_ADS", clientId: scope.clientId ?? undefined },
      select: { id: true, name: true, externalId: true, dataSource: true, status: true, lastSyncAt: true },
    }),
  ]);

  const topAdSets = adSets.slice(0, 10);

  return (
    <div>
      <PageHeader title="Meta Ads" description="Performance consolidada das contas de Facebook e Instagram Ads" actions={<FiltersBar showPlatform={false} />} />

      {accounts.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted">
          Nenhuma conta de Meta Ads conectada{scope.clientId ? " para este cliente" : ""} ainda.
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
            <StatCard label="Alcance" value={current.reach} previousValue={previous.reach} icon={Users2} formatter={(v) => formatNumber(v)} />
            <StatCard label="Frequência" value={current.frequency} previousValue={previous.frequency} icon={Repeat} formatter={(v) => v.toFixed(2)} />
            <StatCard label="Cliques" value={current.clicks} previousValue={previous.clicks} icon={MousePointerClick} formatter={(v) => formatNumber(v)} />
            <StatCard label="CTR" value={current.ctr} previousValue={previous.ctr} icon={Percent} formatter={(v) => formatPercent(v)} />
            <StatCard label="CPC" value={current.cpc} previousValue={previous.cpc} icon={Gauge} formatter={formatBRL} invertDelta />
            <StatCard label="CPM" value={current.cpm} previousValue={previous.cpm} icon={Gauge} formatter={formatBRL} invertDelta />
            <StatCard label="Leads" value={current.leads} previousValue={previous.leads} icon={Target} formatter={(v) => formatNumber(v)} />
            <StatCard label="CPA" value={current.cpa} previousValue={previous.cpa} icon={Gauge} formatter={formatBRL} invertDelta />
            <StatCard label="Faturamento" value={current.conversionValueBrl} previousValue={previous.conversionValueBrl} icon={TrendingUp} formatter={formatBRL} />
            <StatCard label="ROAS" value={current.roas} previousValue={previous.roas} icon={TrendingUp} formatter={(v) => `${v.toFixed(2)}x`} />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <TimeSeriesChart title="Investimento" data={series} metricKey="costBrl" format="brl" color="var(--color-meta)" />
            <TimeSeriesChart title="Conversões" data={series} metricKey="conversions" format="decimal1" color="var(--color-info)" />
          </div>

          <Card className="mt-6">
            <CardHeader><CardTitle>Campanhas</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campanha</TableHead>
                    <TableHead>Status</TableHead>
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
            <CardHeader><CardTitle>Conjuntos de anúncios</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Conjunto</TableHead>
                    <TableHead>Campanha</TableHead>
                    <TableHead className="text-right">Investimento</TableHead>
                    <TableHead className="text-right">CTR</TableHead>
                    <TableHead className="text-right">Conversões</TableHead>
                    <TableHead className="text-right">ROAS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topAdSets.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted">Sem conjuntos de anúncios no período.</TableCell></TableRow>
                  )}
                  {topAdSets.map((ag) => (
                    <TableRow key={ag.id}>
                      <TableCell className="font-medium">{ag.name}</TableCell>
                      <TableCell className="text-muted">{ag.campaignName}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatBRL(ag.costBrl)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatPercent(ag.ctr)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatNumber(ag.conversions, 1)}</TableCell>
                      <TableCell className="text-right tabular-nums">{ag.roas.toFixed(2)}x</TableCell>
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
