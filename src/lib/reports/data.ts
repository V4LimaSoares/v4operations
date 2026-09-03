import "server-only";
import { prisma } from "@/lib/prisma";
import { getSummaryWithComparison, getCampaignPerformance, getMetricsSummary, type DateRange } from "@/lib/data/metrics";
import { pctChange } from "@/lib/utils";

export async function getReportData(clientId: string, range: DateRange) {
  const scope = { clientId, isAggregate: false as const };

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true, name: true, company: true },
  });
  if (!client) return null;

  const accounts = await prisma.adAccount.findMany({
    where: { clientId },
    select: { platform: true, name: true, externalId: true, dataSource: true },
  });

  const [{ current, previous }, campaigns, google, meta] = await Promise.all([
    getSummaryWithComparison(scope, range, "all"),
    getCampaignPerformance(scope, range, "all"),
    getMetricsSummary(scope, range, "GOOGLE_ADS"),
    getMetricsSummary(scope, range, "META_ADS"),
  ]);

  const topCampaigns = [...campaigns].sort((a, b) => b.costBrl - a.costBrl).slice(0, 6);
  const best = [...campaigns].filter((c) => c.costBrl > 0).sort((a, b) => b.roas - a.roas)[0];
  const worst = [...campaigns].filter((c) => c.costBrl > 0).sort((a, b) => a.roas - b.roas)[0];

  const dataSource: "REAL" | "DEMO" = accounts.some((a) => a.dataSource === "REAL") ? "REAL" : "DEMO";

  return {
    client,
    accounts,
    range,
    current,
    previous,
    campaigns: topCampaigns,
    platforms: { google, meta },
    best,
    worst,
    dataSource,
    convChange: pctChange(current.conversions, previous.conversions),
    costChange: pctChange(current.costBrl, previous.costBrl),
    cpaChange: pctChange(current.cpa, previous.cpa),
  };
}

export type ReportData = NonNullable<Awaited<ReturnType<typeof getReportData>>>;
