// Pure period-range helpers for Health Score — split out from src/lib/data/health-score.ts (which
// is server-only, for the Prisma fetchers) because this module is also imported by the client-side
// filter dropdown. Same split as src/lib/sla-config.ts vs src/lib/data/sla.ts.

export type DateRange = { start: Date; end: Date };

// "Todo o período" (no date filter) is the default, not "30d" like the ads dashboards — entries
// are a spreadsheet-imported roster, not daily activity, so most legitimately have an old
// `lastUpdate` and a 30-day default would silently hide most of the portfolio.
export const HEALTH_SCORE_PERIOD_OPTIONS = [
  { value: "all", label: "Todo o período" },
  { value: "7d", label: "Últimos 7 dias" },
  { value: "14d", label: "Últimos 14 dias" },
  { value: "30d", label: "Últimos 30 dias" },
  { value: "90d", label: "Últimos 90 dias" },
] as const;

export function healthScorePeriodToRange(period: string): DateRange | undefined {
  if (period === "all" || !period) return undefined;
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const days = period === "7d" ? 6 : period === "14d" ? 13 : period === "90d" ? 89 : 29; // 30d default
  start.setDate(start.getDate() - days);
  return { start, end };
}
