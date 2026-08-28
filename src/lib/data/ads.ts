import "server-only";
import { prisma } from "@/lib/prisma";
import type { ClientScope } from "@/lib/scope";
import type { DateRange } from "@/lib/data/metrics";
import type { Platform } from "@prisma/client";

export type AdSortKey = "cost" | "roas" | "conversions" | "cpa" | "ctr";

export async function getAdGallery(
  scope: ClientScope,
  range: DateRange,
  opts: { platform?: Platform | "all"; sort?: AdSortKey } = {}
) {
  const ads = await prisma.ad.findMany({
    where: {
      campaign: {
        adAccount: {
          clientId: scope.clientId ?? undefined,
          ...(opts.platform && opts.platform !== "all" ? { platform: opts.platform } : {}),
        },
      },
    },
    include: {
      campaign: { select: { name: true, adAccount: { select: { platform: true, name: true, client: { select: { name: true } } } } } },
      adGroup: { select: { name: true } },
      metrics: { where: { date: { gte: range.start, lte: range.end } } },
    },
    take: 300,
  });

  const rows = ads.map((ad) => {
    const sum = ad.metrics.reduce(
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
    const ctr = sum.impressions > 0 ? (sum.clicks / sum.impressions) * 100 : 0;
    const cpc = sum.clicks > 0 ? sum.costBrl / sum.clicks : 0;
    const cpa = sum.conversions > 0 ? sum.costBrl / sum.conversions : 0;
    const roas = sum.costBrl > 0 ? sum.conversionValueBrl / sum.costBrl : 0;

    return {
      id: ad.id,
      name: ad.name,
      headline: ad.headline,
      description: ad.description,
      imageUrl: ad.imageUrl,
      status: ad.status,
      dataSource: ad.dataSource,
      platform: ad.campaign.adAccount.platform,
      accountName: ad.campaign.adAccount.name,
      clientName: ad.campaign.adAccount.client.name,
      campaignName: ad.campaign.name,
      adGroupName: ad.adGroup.name,
      ...sum,
      ctr,
      cpc,
      cpa,
      roas,
    };
  });

  const sortKey = opts.sort ?? "cost";
  const sorters: Record<AdSortKey, (a: (typeof rows)[number], b: (typeof rows)[number]) => number> = {
    cost: (a, b) => b.costBrl - a.costBrl,
    roas: (a, b) => b.roas - a.roas,
    conversions: (a, b) => b.conversions - a.conversions,
    cpa: (a, b) => (a.cpa || Infinity) - (b.cpa || Infinity),
    ctr: (a, b) => b.ctr - a.ctr,
  };
  return rows.sort(sorters[sortKey]);
}
