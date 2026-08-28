import "server-only";
import { prisma } from "@/lib/prisma";
import type { ClientScope } from "@/lib/scope";

export async function getSearchTerms(scope: ClientScope, limit = 100) {
  const rows = await prisma.searchTerm.findMany({
    where: {
      adAccount: { clientId: scope.clientId ?? undefined, platform: "GOOGLE_ADS" },
    },
    include: {
      campaign: { select: { name: true } },
      adAccount: { select: { name: true, client: { select: { name: true } } } },
    },
    orderBy: { costBrl: "desc" },
    take: limit,
  });

  return rows.map((r) => {
    const impressions = r.impressions;
    const clicks = r.clicks;
    const costBrl = Number(r.costBrl);
    const conversions = Number(r.conversions);
    const conversionValueBrl = Number(r.conversionValueBrl);
    return {
      id: r.id,
      text: r.text,
      status: r.status,
      campaignName: r.campaign.name,
      accountName: r.adAccount.name,
      clientName: r.adAccount.client.name,
      periodStart: r.periodStart,
      periodEnd: r.periodEnd,
      fetchedAt: r.fetchedAt,
      dataSource: r.dataSource,
      impressions,
      clicks,
      costBrl,
      conversions,
      conversionValueBrl,
      ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
      cpc: clicks > 0 ? costBrl / clicks : 0,
      roas: costBrl > 0 ? conversionValueBrl / costBrl : 0,
    };
  });
}
