import Link from "next/link";
import { Wallet, Eye, MousePointerClick, Percent, TrendingUp, Target, Receipt, Ticket, Coins, Layers, Crosshair } from "lucide-react";
import { requireModule } from "@/lib/session";
import { performanceTabItems } from "@/lib/nav";
import { PerformanceTabs } from "@/components/layout/performance-tabs";
import { resolveScope } from "@/lib/scope";
import { presetToRange, getSummaryWithComparison, getDailyTimeSeries, getCampaignPerformance, getMetricsSummary } from "@/lib/data/metrics";
import { PageHeader } from "@/components/layout/page-header";
import { FiltersBar } from "@/components/layout/filters-bar";
import { StatCard } from "@/components/dashboard/stat-card";
import { HeroStat } from "@/components/dashboard/hero-stat";
import { MetricTrendChart } from "@/components/dashboard/metric-trend-chart";
import { DonutChart } from "@/components/dashboard/donut-chart";
import { PlatformBadge, DataSourceBadge, StatusBadge } from "@/components/dashboard/badges";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatBRL, formatNumber, formatPercent, toQueryString } from "@/lib/utils";
import type { Platform } from "@prisma/client";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; platform?: string; clientId?: string }>;
}) {
  const user = await requireModule("dashboard");
  const params = await searchParams;
  const scope = resolveScope(user, params.clientId);
  const range = presetToRange(params.period ?? "30d");
  const platform = (params.platform as Platform | "all") ?? "all";

  const [{ current, previous }, series, campaigns, googleSummary, metaSummary] = await Promise.all([
    getSummaryWithComparison(scope, range, platform),
    getDailyTimeSeries(scope, range, platform),
    getCampaignPerformance(scope, range, platform),
    getMetricsSummary(scope, range, "GOOGLE_ADS"),
    getMetricsSummary(scope, range, "META_ADS"),
  ]);

  const topCampaigns = campaigns.slice(0, 5);
  const investmentByPlatform = [
    { name: "Google Ads", value: googleSummary.costBrl, color: "var(--color-primary)" },
    { name: "Meta Ads", value: metaSummary.costBrl, color: "var(--color-chart-orange)" },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={scope.isAggregate ? "Visão agregada de todos os clientes" : "Performance de campanhas no período selecionado"}
        actions={<FiltersBar />}
      />
      <PerformanceTabs
        items={performanceTabItems(user.role, user.modulePermissions)}
        active="/dashboard"
        queryString={toQueryString(params)}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <HeroStat label="Investimento" value={current.costBrl} previousValue={previous.costBrl} icon={Wallet} formatter={formatBRL} tone="primary" />
        <HeroStat label="Faturamento" value={current.revenueBrl} previousValue={previous.revenueBrl} icon={Receipt} formatter={formatBRL} tone="positive" />
        <HeroStat label="ROAS" value={current.roas} previousValue={previous.roas} icon={TrendingUp} formatter={(v) => `${v.toFixed(2)}x`} tone="info" />
        <HeroStat label="Conversões" value={current.conversions} previousValue={previous.conversions} icon={Target} formatter={(v) => formatNumber(v, 1)} tone="warning" />
      </div>

      <h2 className="mb-3 mt-6 text-xs font-semibold uppercase tracking-wide text-muted-2">Métricas detalhadas</h2>
      <div className="flex flex-wrap gap-4">
        <StatCard className="min-w-[170px] flex-1 basis-56" label="Impressões" value={current.impressions} previousValue={previous.impressions} icon={Eye} formatter={(v) => formatNumber(v)} />
        <StatCard className="min-w-[170px] flex-1 basis-56" label="Cliques" value={current.clicks} previousValue={previous.clicks} icon={MousePointerClick} formatter={(v) => formatNumber(v)} />
        <StatCard className="min-w-[170px] flex-1 basis-56" label="CTR" value={current.ctr} previousValue={previous.ctr} icon={Percent} formatter={(v) => formatPercent(v)} />
        <StatCard className="min-w-[170px] flex-1 basis-56" label="CPC" value={current.cpc} previousValue={previous.cpc} icon={Coins} formatter={formatBRL} invertDelta />
        <StatCard className="min-w-[170px] flex-1 basis-56" label="CPM" value={current.cpm} previousValue={previous.cpm} icon={Layers} formatter={formatBRL} invertDelta />
        <StatCard className="min-w-[170px] flex-1 basis-56" label="CPA" value={current.cpa} previousValue={previous.cpa} icon={Crosshair} formatter={formatBRL} invertDelta />
        <StatCard className="min-w-[170px] flex-1 basis-56" label="Ticket médio" value={current.avgTicket} previousValue={previous.avgTicket} icon={Ticket} formatter={formatBRL} />
      </div>

      <h2 className="mb-3 mt-6 text-xs font-semibold uppercase tracking-wide text-muted-2">Evolução no período</h2>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MetricTrendChart
            title="Evolução no período"
            data={series}
            metrics={[
              { key: "costBrl", label: "Investimento", format: "brl", color: "var(--color-primary)" },
              { key: "conversionValueBrl", label: "Faturamento", format: "brl", color: "var(--color-chart-yellow)" },
              { key: "conversions", label: "Conversões", format: "decimal1", color: "var(--color-chart-orange)" },
            ]}
          />
        </div>
        <DonutChart title="Investimento por plataforma" data={investmentByPlatform} format="brl" />
      </div>

      <Card className="mt-6">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Campanhas com melhor investimento</CardTitle>
          <Link href="/campanhas" className="text-xs font-medium text-primary hover:underline">
            Ver todas
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campanha</TableHead>
                {scope.isAggregate && <TableHead>Cliente</TableHead>}
                <TableHead>Plataforma</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Investimento</TableHead>
                <TableHead className="text-right">Conversões</TableHead>
                <TableHead className="text-right">ROAS</TableHead>
                <TableHead>Origem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topCampaigns.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-muted">
                    Sem campanhas no período selecionado.
                  </TableCell>
                </TableRow>
              )}
              {topCampaigns.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  {scope.isAggregate && <TableCell className="text-muted">{c.clientName}</TableCell>}
                  <TableCell><PlatformBadge platform={c.platform} /></TableCell>
                  <TableCell><StatusBadge status={c.status} /></TableCell>
                  <TableCell className="text-right tabular-nums">{formatBRL(c.costBrl)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatNumber(c.conversions, 1)}</TableCell>
                  <TableCell className="text-right tabular-nums">{c.roas.toFixed(2)}x</TableCell>
                  <TableCell><DataSourceBadge dataSource={c.dataSource} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
