import "server-only";
import { prisma } from "@/lib/prisma";
import type { ClientScope } from "@/lib/scope";

export type FunnelData = {
  periodStart: Date;
  periodEnd: Date;
  impressions: number;
  clicks: number;
  costBrl: number;
  stages: { name: string; order: number; conversions: number; rateFromPrevious: number | null; costPerConversion: number }[];
};

/**
 * The funnel is a fixed-period snapshot (like the search terms report): stage counts come
 * from FunnelStage, impressions/clicks/cost come from Metric rows in that exact same window
 * so the per-stage rates and cost stay internally consistent — not from whatever date range
 * filter is selected elsewhere on the page.
 */
export async function getFunnelData(scope: ClientScope): Promise<FunnelData | null> {
  const stages = await prisma.funnelStage.findMany({
    where: { adAccount: { clientId: scope.clientId ?? undefined, platform: "GOOGLE_ADS" } },
    orderBy: { order: "asc" },
  });

  if (stages.length === 0) return null;

  const periodStart = stages[0].periodStart;
  const periodEnd = stages[0].periodEnd;

  const agg = await prisma.metric.aggregate({
    where: {
      adAccount: { clientId: scope.clientId ?? undefined, platform: "GOOGLE_ADS" },
      keywordId: null,
      date: { gte: periodStart, lte: periodEnd },
    },
    _sum: { impressions: true, clicks: true, costBrl: true },
  });

  const impressions = agg._sum.impressions ?? 0;
  const clicks = agg._sum.clicks ?? 0;
  const costBrl = Number(agg._sum.costBrl ?? 0);

  // Group by stage name (aggregate mode can have the same stage name across multiple accounts).
  const byName = new Map<string, { order: number; conversions: number }>();
  for (const s of stages) {
    const existing = byName.get(s.name);
    const conversions = Number(s.conversions);
    if (existing) existing.conversions += conversions;
    else byName.set(s.name, { order: s.order, conversions });
  }

  const ordered = Array.from(byName.entries())
    .map(([name, v]) => ({ name, order: v.order, conversions: v.conversions }))
    .sort((a, b) => a.order - b.order);

  let previous = clicks;
  const result = ordered.map((stage) => {
    const rateFromPrevious = previous > 0 ? (stage.conversions / previous) * 100 : null;
    const costPerConversion = stage.conversions > 0 ? costBrl / stage.conversions : 0;
    previous = stage.conversions;
    return { ...stage, rateFromPrevious, costPerConversion };
  });

  return { periodStart, periodEnd, impressions, clicks, costBrl, stages: result };
}
