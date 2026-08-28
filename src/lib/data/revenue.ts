import "server-only";
import { prisma } from "@/lib/prisma";
import type { ClientScope } from "@/lib/scope";
import type { DateRange } from "@/lib/data/metrics";

export async function listRevenueEntries(scope: ClientScope, range: DateRange) {
  return prisma.revenueEntry.findMany({
    where: { clientId: scope.clientId ?? undefined, date: { gte: range.start, lte: range.end } },
    include: { client: { select: { name: true } } },
    orderBy: { date: "desc" },
    take: 200,
  });
}

export async function getRevenueSeries(scope: ClientScope, range: DateRange) {
  const rows = await prisma.revenueEntry.findMany({
    where: { clientId: scope.clientId ?? undefined, date: { gte: range.start, lte: range.end } },
    select: { date: true, amountBrl: true },
  });

  const byDate = new Map<string, number>();
  for (const row of rows) {
    const key = row.date.toISOString().slice(0, 10);
    byDate.set(key, (byDate.get(key) ?? 0) + Number(row.amountBrl));
  }

  return Array.from(byDate.entries())
    .map(([date, amountBrl]) => ({ date, amountBrl }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
