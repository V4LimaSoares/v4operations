/**
 * Pure helpers for the Controle de SLA "Dashboard" view — period/client filtering on top of data
 * that isn't shaped for it natively (see sla-dashboard-view.tsx for what that limits).
 */

export const SLA_PERIOD_OPTIONS = [
  { value: "7d", label: "Últimos 7 dias" },
  { value: "14d", label: "Últimos 14 dias" },
  { value: "30d", label: "Últimos 30 dias" },
  { value: "90d", label: "Últimos 90 dias" },
  { value: "custom", label: "Personalizado" },
] as const;

/** "YYYY-MM-DD" (native `<input type="date">` value) → a local Date at midnight. */
function parseDateInput(value: string): Date | null {
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const [, y, mo, d] = m;
  return new Date(Number(y), Number(mo) - 1, Number(d));
}

/** Calendar-day span for a period value — used to filter dated records (alerts, reports).
 *  "custom" uses `from`/`to` (both "YYYY-MM-DD") when given; falls back to the last 30 days if
 *  either is missing or unparseable, same as an unrecognized period value already did. */
export function slaPeriodToCalendarRange(period: string, from?: string, to?: string): { start: Date; end: Date } {
  if (period === "custom" && from && to) {
    const start = parseDateInput(from);
    const end = parseDateInput(to);
    if (start && end) {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return start <= end ? { start, end } : { start: end, end: start };
    }
  }
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const days = period === "7d" ? 6 : period === "14d" ? 13 : period === "90d" ? 89 : 29; // 30d default
  start.setDate(start.getDate() - days);
  return { start, end };
}

/** How many entries to take off the END of a chronologically-ascending (oldest→today) array for
 *  a given period, clamped to what the array actually holds — the automation only keeps a rolling
 *  window (currently 14 business days), so a longer period silently gets everything available.
 *  "custom" counts actual weekdays (Mon-Fri) between `from` and `to`. */
export function slaBusinessDaySliceCount(period: string, arrayLength: number, from?: string, to?: string): number {
  if (period === "custom" && from && to) {
    const start = parseDateInput(from);
    const end = parseDateInput(to);
    if (start && end) {
      const [lo, hi] = start <= end ? [start, end] : [end, start];
      let businessDays = 0;
      for (const d = new Date(lo); d <= hi; d.setDate(d.getDate() + 1)) {
        const day = d.getDay();
        if (day !== 0 && day !== 6) businessDays++;
      }
      return Math.min(businessDays, arrayLength);
    }
  }
  const businessDays = period === "7d" ? 5 : period === "14d" ? 10 : period === "90d" ? 64 : 22; // 30d default
  return Math.min(businessDays, arrayLength);
}

/** Parses the automation's "DD/MM/YYYY" (optionally "DD/MM/YYYY HH:mm") date strings. */
export function parseSlaDate(value: string): Date | null {
  const m = value.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (!m) return null;
  const [, d, mo, y] = m;
  return new Date(Number(y), Number(mo) - 1, Number(d));
}

export function isSlaDateInRange(value: string, range: { start: Date; end: Date }): boolean {
  const d = parseSlaDate(value);
  if (!d) return false;
  return d >= range.start && d <= range.end;
}
