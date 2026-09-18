import { requireModule } from "@/lib/session";
import { resolveScope } from "@/lib/scope";
import { presetToRange, getCampaignPerformance } from "@/lib/data/metrics";
import { PageHeader } from "@/components/layout/page-header";
import { FiltersBar } from "@/components/layout/filters-bar";
import { PlatformBadge, StatusBadge, DataSourceBadge } from "@/components/dashboard/badges";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatBRL, formatNumber, formatPercent } from "@/lib/utils";
import type { Platform } from "@prisma/client";

export default async function CampanhasPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; platform?: string; clientId?: string }>;
}) {
  const user = await requireModule("campanhas");
  const params = await searchParams;
  const scope = resolveScope(user, params.clientId);
  const range = presetToRange(params.period ?? "30d");
  const platform = (params.platform as Platform | "all") ?? "all";

  const campaigns = await getCampaignPerformance(scope, range, platform);

  return (
    <div>
      <PageHeader
        title="Campanhas"
        description="Todas as campanhas de Google Ads e Meta Ads no período selecionado"
        actions={<FiltersBar />}
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campanha</TableHead>
                {scope.isAggregate && <TableHead>Cliente</TableHead>}
                <TableHead>Plataforma</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Investimento</TableHead>
                <TableHead className="text-right">Impressões</TableHead>
                <TableHead className="text-right">Cliques</TableHead>
                <TableHead className="text-right">CTR</TableHead>
                <TableHead className="text-right">CPC</TableHead>
                <TableHead className="text-right">Conversões</TableHead>
                <TableHead className="text-right">CPA</TableHead>
                <TableHead className="text-right">ROAS</TableHead>
                <TableHead>Origem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.length === 0 && (
                <TableRow>
                  <TableCell colSpan={12} className="py-10 text-center text-muted">
                    Nenhuma campanha encontrada no período selecionado.
                  </TableCell>
                </TableRow>
              )}
              {campaigns.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  {scope.isAggregate && <TableCell className="text-muted">{c.clientName}</TableCell>}
                  <TableCell><PlatformBadge platform={c.platform} /></TableCell>
                  <TableCell><StatusBadge status={c.status} /></TableCell>
                  <TableCell className="text-right tabular-nums">{formatBRL(c.costBrl)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatNumber(c.impressions)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatNumber(c.clicks)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatPercent(c.ctr)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatBRL(c.cpc)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatNumber(c.conversions, 1)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatBRL(c.cpa)}</TableCell>
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
