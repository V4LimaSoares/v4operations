import "server-only";
import { prisma } from "@/lib/prisma";
import type { ClientScope } from "@/lib/scope";
import type { DateRange } from "@/lib/data/metrics";
import type { Platform } from "@prisma/client";

type MetricSum = { impressions: number; clicks: number; costBrl: number; conversions: number; conversionValueBrl: number };

function sumMetrics(metrics: { impressions: number; clicks: number; costBrl: unknown; conversions: unknown; conversionValueBrl: unknown }[]): MetricSum {
  const acc: MetricSum = { impressions: 0, clicks: 0, costBrl: 0, conversions: 0, conversionValueBrl: 0 };
  for (const m of metrics) {
    acc.impressions += m.impressions;
    acc.clicks += m.clicks;
    acc.costBrl += Number(m.costBrl);
    acc.conversions += Number(m.conversions);
    acc.conversionValueBrl += Number(m.conversionValueBrl);
  }
  return acc;
}

function derive(sum: ReturnType<typeof sumMetrics>) {
  return {
    ...sum,
    ctr: sum.impressions > 0 ? (sum.clicks / sum.impressions) * 100 : 0,
    cpc: sum.clicks > 0 ? sum.costBrl / sum.clicks : 0,
    cpa: sum.conversions > 0 ? sum.costBrl / sum.conversions : 0,
    roas: sum.costBrl > 0 ? sum.conversionValueBrl / sum.costBrl : 0,
  };
}

/** Google "Ad Groups" or Meta "Ad Sets" — same underlying model, unified by platform. */
export async function getAdGroupPerformance(scope: ClientScope, range: DateRange, platform?: Platform | "all") {
  const adGroups = await prisma.adGroup.findMany({
    where: {
      campaign: {
        adAccount: {
          clientId: scope.clientId ?? undefined,
          ...(platform && platform !== "all" ? { platform } : {}),
        },
      },
    },
    include: {
      campaign: { select: { name: true, adAccount: { select: { platform: true, name: true, client: { select: { name: true } } } } } },
      metrics: { where: { date: { gte: range.start, lte: range.end }, keywordId: null } },
    },
    take: 300,
  });

  return adGroups
    .map((ag) => ({
      id: ag.id,
      name: ag.name,
      status: ag.status,
      campaignName: ag.campaign.name,
      platform: ag.campaign.adAccount.platform,
      accountName: ag.campaign.adAccount.name,
      clientName: ag.campaign.adAccount.client.name,
      dataSource: ag.dataSource,
      ...derive(sumMetrics(ag.metrics)),
    }))
    .sort((a, b) => b.costBrl - a.costBrl);
}

export async function getKeywordPerformance(scope: ClientScope, range: DateRange) {
  const keywords = await prisma.keyword.findMany({
    where: {
      campaign: { adAccount: { clientId: scope.clientId ?? undefined, platform: "GOOGLE_ADS" } },
    },
    include: {
      campaign: { select: { name: true } },
      adGroup: { select: { name: true } },
      metrics: { where: { date: { gte: range.start, lte: range.end } } },
    },
    take: 300,
  });

  return keywords
    .map((k) => ({
      id: k.id,
      text: k.text,
      matchType: k.matchType,
      status: k.status,
      qualityScore: k.qualityScore,
      campaignName: k.campaign.name,
      adGroupName: k.adGroup.name,
      dataSource: k.dataSource,
      ...derive(sumMetrics(k.metrics)),
    }))
    .sort((a, b) => b.costBrl - a.costBrl);
}
