import "server-only";
import { prisma } from "@/lib/prisma";
import type { DateRange } from "@/lib/data/metrics";

export async function listClientsWithStats(range: DateRange) {
  const clients = await prisma.client.findMany({
    orderBy: { name: "asc" },
    include: {
      adAccounts: { select: { id: true, platform: true, name: true, dataSource: true } },
      users: { select: { id: true, email: true, active: true }, where: { role: "CLIENT" } },
      teamMembers: { include: { teamMember: { select: { id: true, name: true, colorVar: true } } } },
    },
  });

  const stats = await prisma.metric.groupBy({
    by: ["adAccountId"],
    where: { date: { gte: range.start, lte: range.end } },
    _sum: { costBrl: true, conversions: true, conversionValueBrl: true },
  });

  const revenueByClient = await prisma.revenueEntry.groupBy({
    by: ["clientId"],
    where: { date: { gte: range.start, lte: range.end } },
    _sum: { amountBrl: true },
  });
  const revenueMap = new Map(revenueByClient.map((r) => [r.clientId, Number(r._sum.amountBrl ?? 0)]));

  const accountToClient = new Map<string, string>();
  for (const c of clients) {
    for (const a of c.adAccounts) accountToClient.set(a.id, c.id);
  }

  const byClient = new Map<string, { costBrl: number; conversions: number; conversionValueBrl: number }>();
  for (const row of stats) {
    const clientId = accountToClient.get(row.adAccountId);
    if (!clientId) continue;
    const acc = byClient.get(clientId) ?? { costBrl: 0, conversions: 0, conversionValueBrl: 0 };
    acc.costBrl += Number(row._sum.costBrl ?? 0);
    acc.conversions += Number(row._sum.conversions ?? 0);
    acc.conversionValueBrl += Number(row._sum.conversionValueBrl ?? 0);
    byClient.set(clientId, acc);
  }

  return clients.map((c) => {
    const agg = byClient.get(c.id) ?? { costBrl: 0, conversions: 0, conversionValueBrl: 0 };
    const revenueBrl = revenueMap.get(c.id) ?? agg.conversionValueBrl;
    const googleAccounts = c.adAccounts.filter((a) => a.platform === "GOOGLE_ADS");
    const metaAccounts = c.adAccounts.filter((a) => a.platform === "META_ADS");
    return {
      id: c.id,
      name: c.name,
      company: c.company,
      status: c.status,
      notes: c.notes,
      slaGroupName: c.slaGroupName,
      ekyteClientName: c.ekyteClientName,
      createdAt: c.createdAt,
      googleAccounts,
      metaAccounts,
      email: c.users[0]?.email ?? null,
      userActive: c.users[0]?.active ?? null,
      costBrl: agg.costBrl,
      conversions: agg.conversions,
      revenueBrl,
      roas: agg.costBrl > 0 ? revenueBrl / agg.costBrl : 0,
      team: c.teamMembers.map((t) => t.teamMember),
    };
  });
}

export async function getClientById(id: string) {
  return prisma.client.findUnique({
    where: { id },
    include: {
      adAccounts: { select: { id: true, platform: true, name: true, dataSource: true, externalId: true } },
      users: { select: { id: true, email: true, active: true }, where: { role: "CLIENT" } },
      teamMembers: { include: { teamMember: true }, orderBy: { teamMember: { name: "asc" } } },
      squads: { include: { squad: { select: { id: true, name: true, logoUrl: true } } } },
      portfolioItems: { include: { item: true }, orderBy: { item: { service: "asc" } } },
    },
  });
}
