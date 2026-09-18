import "server-only";
import { prisma } from "@/lib/prisma";
import { CHECKLIST_ITEMS } from "@/lib/health-score-checklist";
import type { DateRange } from "@/lib/health-score-period";

export type { DateRange } from "@/lib/health-score-period";
export { HEALTH_SCORE_PERIOD_OPTIONS, healthScorePeriodToRange } from "@/lib/health-score-period";

export async function listHealthScoreEntries(clientId?: string, range?: DateRange) {
  return prisma.healthScoreEntry.findMany({
    where: {
      ...(clientId ? { clientId } : {}),
      ...(range ? { lastUpdate: { gte: range.start, lte: range.end } } : {}),
    },
    orderBy: [{ clientName: "asc" }, { product: "asc" }],
  });
}

export async function getHealthScoreEntry(id: string) {
  return prisma.healthScoreEntry.findUnique({ where: { id } });
}

/** Used by the unified client detail page's "Saúde" tab — a client may have more than one entry
 *  (e.g. one per product), so this returns the full list rather than assuming a single row. */
export async function getHealthScoreEntriesByClientId(clientId: string) {
  return prisma.healthScoreEntry.findMany({ where: { clientId }, orderBy: { product: "asc" } });
}

export type HealthScoreAggregate = {
  totalEntries: number;
  totalClients: number;
  ongoing: number;
  churn: number;
  healthy: number;
  atRisk: number;
  imminentRisk: number;
  avgChurnProbability: number;
  totalFeeBrl: number;
  totalRevenueGoalBrl: number;
  totalRevenueAchievedBrl: number;
  totalInvestmentGoalBrl: number;
  totalInvestmentAchievedBrl: number;
  hsOverdueCount: number;
  worstChecklistItems: { key: string; label: string; failCount: number; totalAnswered: number }[];
};

function normalizeFlag(flag: string | null) {
  const f = (flag ?? "").trim().toLowerCase();
  if (f.startsWith("risco iminente")) return "imminent";
  if (f.startsWith("risco")) return "risk";
  if (f.startsWith("saud")) return "healthy";
  return "unknown";
}

export async function getHealthScoreAggregate(clientId?: string, range?: DateRange): Promise<HealthScoreAggregate> {
  const entries = await listHealthScoreEntries(clientId, range);

  const totalClients = new Set(entries.map((e) => e.clientName)).size;
  const ongoing = entries.filter((e) => e.phase.toLowerCase() === "ongoing").length;
  const churn = entries.filter((e) => e.phase.toLowerCase() === "churn").length;

  let healthy = 0, atRisk = 0, imminentRisk = 0;
  for (const e of entries) {
    const n = normalizeFlag(e.flag);
    if (n === "healthy") healthy++;
    else if (n === "risk") atRisk++;
    else if (n === "imminent") imminentRisk++;
  }

  const churnValues = entries.map((e) => e.churnProbabilityPct).filter((v): v is number => v != null);
  const avgChurnProbability = churnValues.length
    ? churnValues.reduce((a: number, b) => a + b, 0) / churnValues.length
    : 0;

  const sum = (values: (number | null)[]) => values.reduce((a: number, b) => a + (b ?? 0), 0);

  const hsOverdueCount = entries.filter((e) => (e.hsUpToDate ?? "").toLowerCase().startsWith("atras")).length;

  const worstChecklistItems = CHECKLIST_ITEMS.map((item) => {
    let failCount = 0;
    let totalAnswered = 0;
    for (const e of entries) {
      const checklist = e.checklist as Record<string, string> | null;
      const answer = checklist?.[item.key];
      if (!answer) continue;
      totalAnswered++;
      if (answer === "Não") failCount++;
    }
    return { key: item.key, label: item.label, failCount, totalAnswered };
  })
    .filter((i) => i.failCount > 0)
    .sort((a, b) => b.failCount - a.failCount)
    .slice(0, 5);

  return {
    totalEntries: entries.length,
    totalClients,
    ongoing,
    churn,
    healthy,
    atRisk,
    imminentRisk,
    avgChurnProbability,
    totalFeeBrl: sum(entries.map((e) => e.feeBrl)),
    totalRevenueGoalBrl: sum(entries.map((e) => e.revenueGoalBrl)),
    totalRevenueAchievedBrl: sum(entries.map((e) => e.revenueAchievedBrl)),
    totalInvestmentGoalBrl: sum(entries.map((e) => e.investmentGoalBrl)),
    totalInvestmentAchievedBrl: sum(entries.map((e) => e.investmentAchievedBrl)),
    hsOverdueCount,
    worstChecklistItems,
  };
}

export function upcomingReplans(entries: Awaited<ReturnType<typeof listHealthScoreEntries>>, withinDays = 30) {
  const now = new Date();
  const limit = new Date(now.getTime() + withinDays * 86400000);
  return entries
    .filter((e) => e.replanDate && e.replanDate >= now && e.replanDate <= limit)
    .sort((a, b) => (a.replanDate!.getTime() - b.replanDate!.getTime()));
}

export function upcomingCheckins(entries: Awaited<ReturnType<typeof listHealthScoreEntries>>, withinDays = 14) {
  const now = new Date();
  const limit = new Date(now.getTime() + withinDays * 86400000);
  return entries
    .filter((e) => e.nextCheckin && e.nextCheckin >= now && e.nextCheckin <= limit)
    .sort((a, b) => (a.nextCheckin!.getTime() - b.nextCheckin!.getTime()));
}
