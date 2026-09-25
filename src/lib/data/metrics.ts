import "server-only";
import { prisma } from "@/lib/prisma";
import type { ClientScope } from "@/lib/scope";
import type { Platform } from "@prisma/client";

export type DateRange = { start: Date; end: Date };

export function getPreviousPeriod(range: DateRange): DateRange {
  const durationMs = range.end.getTime() - range.start.getTime();
  const end = new Date(range.start.getTime() - 24 * 60 * 60 * 1000);
  const start = new Date(end.getTime() - durationMs);
  return { start, end };
}

export function presetToRange(preset: string): DateRange {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  switch (preset) {
    case "today":
      break;
    case "7d":
      start.setDate(start.getDate() - 6);
      break;
    case "14d":
      start.setDate(start.getDate() - 13);
      break;
    case "90d":
      start.setDate(start.getDate() - 89);
      break;
    case "30d":
    default:
      start.setDate(start.getDate() - 29);
      break;
  }
  return { start, end };
}

// Keyword-level rows are a separate dimensional slice of the same spend (Google Ads reports
// keyword performance as its own complete partition of a campaign, not additive to ad-level
// rows). Every rollup below excludes them via keywordId: null so cost/clicks/etc. aren't
// double-counted; only getKeywordPerformance() reads the keywordId-tagged rows directly.
function metricWhere(scope: ClientScope, range: DateRange, platform?: Platform | "all") {
  return {
    date: { gte: range.start, lte: range.end },
    keywordId: null,
    ...(platform && platform !== "all" ? { platform } : {}),
    adAccount: scope.clientId ? { clientId: scope.clientId } : {},
  };
}

export type MetricsSummary = {
  impressions: number;
  clicks: number;
  costBrl: number;
  conversions: number;
  conversionValueBrl: number;
  /** Real business revenue (RevenueEntry) for the period — 0 when nothing was cadastrado, same as
   *  before. Kept separate from conversionValueBrl on purpose (see roasPlatform/mer below); never
   *  silently substituted for the other anymore. */
  revenueBrl: number;
  /** How many RevenueEntry rows made up revenueBrl — lets avgTicket divide by actual lançamentos
   *  instead of ad-platform "conversions" (see Performance audit, Fase 5). */
  revenueEntryCount: number;
  ctr: number;
  cpc: number;
  cpm: number;
  cpa: number;
  /** Platform-attributed ROAS: conversionValueBrl / costBrl. What Google/Meta themselves are
   *  claiming credit for — always computable, never depends on Faturamento being cadastrado. */
  roasPlatform: number;
  /** Blended ROAS / MER: real revenueBrl / costBrl. Null (not 0) when no RevenueEntry exists for
   *  the period — "sem dado", not "zero resultado". Callers must handle the null case explicitly
   *  instead of defaulting to 0, which would read as a real (bad) number. */
  mer: number | null;
  /** Ticket médio sobre lançamentos reais de faturamento — null quando não há lançamento no
   *  período (evita dividir receita real por "conversões" de mídia, que podem ser lead, clique
   *  qualificado etc., não necessariamente uma venda). */
  avgTicket: number | null;
  reach: number;
  frequency: number;
  leads: number;
  costPerLead: number;
  /** True when at least one Metric row exists for this scope/period — lets the UI show "sem
   *  dado" instead of R$ 0,00/0.00x when a KPI is genuinely unmeasured rather than zero. */
  hasData: boolean;
};

function deriveSummary(raw: {
  impressions: number;
  clicks: number;
  costBrl: number;
  conversions: number;
  conversionValueBrl: number;
  revenueBrl?: number;
  revenueEntryCount?: number;
  reach?: number;
  leads?: number;
  hasData?: boolean;
}): MetricsSummary {
  const { impressions, clicks, costBrl, conversions, conversionValueBrl } = raw;
  const revenueBrl = raw.revenueBrl ?? 0;
  const revenueEntryCount = raw.revenueEntryCount ?? 0;
  const reach = raw.reach ?? 0;
  const leads = raw.leads ?? 0;
  return {
    impressions,
    clicks,
    costBrl,
    conversions,
    conversionValueBrl,
    revenueBrl,
    revenueEntryCount,
    reach,
    leads,
    ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
    cpc: clicks > 0 ? costBrl / clicks : 0,
    cpm: impressions > 0 ? (costBrl / impressions) * 1000 : 0,
    cpa: conversions > 0 ? costBrl / conversions : 0,
    roasPlatform: costBrl > 0 ? conversionValueBrl / costBrl : 0,
    mer: revenueEntryCount > 0 && costBrl > 0 ? revenueBrl / costBrl : null,
    avgTicket: revenueEntryCount > 0 ? revenueBrl / revenueEntryCount : null,
    frequency: reach > 0 ? impressions / reach : 0,
    costPerLead: leads > 0 ? costBrl / leads : 0,
    hasData: raw.hasData ?? true,
  };
}

export async function getMetricsSummary(
  scope: ClientScope,
  range: DateRange,
  platform?: Platform | "all"
): Promise<MetricsSummary> {
  const agg = await prisma.metric.aggregate({
    where: metricWhere(scope, range, platform),
    _count: { _all: true },
    _sum: {
      impressions: true,
      clicks: true,
      costBrl: true,
      conversions: true,
      conversionValueBrl: true,
      reach: true,
      leads: true,
    },
  });

  const rev = await prisma.revenueEntry.aggregate({
    where: {
      clientId: scope.clientId ?? undefined,
      date: { gte: range.start, lte: range.end },
    },
    _sum: { amountBrl: true },
    _count: { _all: true },
  });

  return deriveSummary({
    impressions: agg._sum.impressions ?? 0,
    clicks: agg._sum.clicks ?? 0,
    costBrl: Number(agg._sum.costBrl ?? 0),
    conversions: Number(agg._sum.conversions ?? 0),
    conversionValueBrl: Number(agg._sum.conversionValueBrl ?? 0),
    reach: agg._sum.reach ?? 0,
    leads: agg._sum.leads ?? 0,
    revenueBrl: rev._sum.amountBrl ? Number(rev._sum.amountBrl) : 0,
    revenueEntryCount: rev._count._all,
    hasData: agg._count._all > 0,
  });
}

export async function getSummaryWithComparison(
  scope: ClientScope,
  range: DateRange,
  platform?: Platform | "all"
) {
  const previous = getPreviousPeriod(range);
  const [current, prior] = await Promise.all([
    getMetricsSummary(scope, range, platform),
    getMetricsSummary(scope, previous, platform),
  ]);
  return { current, previous: prior, previousRange: previous };
}

export type DailyPoint = {
  date: string;
  impressions: number;
  clicks: number;
  costBrl: number;
  conversions: number;
  conversionValueBrl: number;
};

export async function getDailyTimeSeries(
  scope: ClientScope,
  range: DateRange,
  platform?: Platform | "all"
): Promise<DailyPoint[]> {
  const rows = await prisma.metric.findMany({
    where: metricWhere(scope, range, platform),
    select: {
      date: true,
      impressions: true,
      clicks: true,
      costBrl: true,
      conversions: true,
      conversionValueBrl: true,
    },
  });

  const byDate = new Map<string, DailyPoint>();
  for (const row of rows) {
    const key = row.date.toISOString().slice(0, 10);
    const existing = byDate.get(key) ?? {
      date: key,
      impressions: 0,
      clicks: 0,
      costBrl: 0,
      conversions: 0,
      conversionValueBrl: 0,
    };
    existing.impressions += row.impressions;
    existing.clicks += row.clicks;
    existing.costBrl += Number(row.costBrl);
    existing.conversions += Number(row.conversions);
    existing.conversionValueBrl += Number(row.conversionValueBrl);
    byDate.set(key, existing);
  }

  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export async function getCampaignPerformance(
  scope: ClientScope,
  range: DateRange,
  platform?: Platform | "all"
) {
  const campaigns = await prisma.campaign.findMany({
    where: {
      adAccount: {
        clientId: scope.clientId ?? undefined,
        ...(platform && platform !== "all" ? { platform } : {}),
      },
    },
    include: {
      adAccount: { select: { platform: true, name: true, dataSource: true, client: { select: { name: true } } } },
      metrics: { where: { date: { gte: range.start, lte: range.end }, keywordId: null } },
    },
  });

  return campaigns
    .map((c) => {
      const sum = c.metrics.reduce(
        (acc, m) => {
          acc.impressions += m.impressions;
          acc.clicks += m.clicks;
          acc.costBrl += Number(m.costBrl);
          acc.conversions += Number(m.conversions);
          acc.conversionValueBrl += Number(m.conversionValueBrl);
          return acc;
        },
        { impressions: 0, clicks: 0, costBrl: 0, conversions: 0, conversionValueBrl: 0 }
      );
      return {
        id: c.id,
        name: c.name,
        status: c.status,
        objective: c.objective,
        budgetDailyBrl: c.budgetDailyBrl ? Number(c.budgetDailyBrl) : null,
        platform: c.adAccount.platform,
        accountName: c.adAccount.name,
        clientName: c.adAccount.client.name,
        dataSource: c.adAccount.dataSource,
        ...deriveSummary(sum),
      };
    })
    .sort((a, b) => b.costBrl - a.costBrl);
}
