/**
 * Data access for the Ekyte module — team workload, task production and time tracking pulled
 * from the agency's project-management tool (Ekyte).
 *
 * Tasks are now live: `getEkyteSnapshot()` reads the latest row of the `EkyteSnapshot` table,
 * refreshed on demand by the "Atualizar agora" button on Operação (POST /api/admin/ekyte/refresh,
 * see src/lib/ekyte-api.ts). Falls back to the bundled JSON snapshot only if no row exists yet —
 * i.e. right after this feature's first deploy, before anyone has clicked the button once. Ekyte
 * doesn't expose a direct time-tracking endpoint (checked — see ekyte-api.ts), so time entries
 * stay whatever was last saved (bundled JSON until the first refresh, from then on whatever a
 * refresh captured last, since the DB row also carries the previous timeJson forward).
 */
import { cache } from "react";
import raw from "@/lib/data/ekyte-data.json";
import { prisma } from "@/lib/prisma";

export type EkyteSituation = 10 | 20 | 30 | 40; // Ativa | Pausada | Concluída | Cancelada

export type EkyteTask = {
  id: number;
  date: string; // due date, YYYY-MM-DD
  creationDate: string;
  client: string;
  executor: string;
  executorEmail?: string;
  type: string;
  phase: string;
  situation: EkyteSituation;
  est: number; // estimated minutes
  act: number; // actual minutes logged on the task record itself
};

export type EkyteTimeEntry = {
  id: number;
  date: string; // YYYY-MM-DD, when the hours were logged
  client: string;
  executor: string;
  executorEmail?: string;
  type: string;
  taskId: number;
  minutes: number;
};

type RawShape = { generatedAt: string; tasks: EkyteTask[]; timeTrackings: EkyteTimeEntry[] };
const BUNDLED = raw as RawShape;

/** Request-memoized (via React's `cache()`) so every section on a page shares one DB read. */
export const getEkyteSnapshot = cache(async (): Promise<RawShape> => {
  const row = await prisma.ekyteSnapshot.findFirst({ orderBy: { generatedAt: "desc" } });
  if (!row) return BUNDLED;
  return {
    generatedAt: row.generatedAt.toISOString(),
    tasks: row.tasksJson as unknown as EkyteTask[],
    timeTrackings: row.timeJson as unknown as EkyteTimeEntry[],
  };
});

/** Real current date, YYYY-MM-DD — data is live now, so "today" is the server's actual clock
 *  instead of the date the old static snapshot happened to be pulled on. */
export function ekyteToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function addYears(iso: string, n: number): string {
  const [y, m, d] = iso.split("-");
  return `${String(Number(y) + n).padStart(4, "0")}-${m}-${d}`;
}
export const EKYTE_DATA_MIN = addYears(ekyteToday(), -1);
export const EKYTE_DATA_MAX = addYears(ekyteToday(), 1);

export const EKYTE_SITUATION_LABEL: Record<EkyteSituation, string> = {
  10: "Ativa",
  20: "Pausada",
  30: "Concluída",
  40: "Cancelada",
};

export type EkyteRange = { start: string; end: string };

function addDays(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
function diffDays(startIso: string, endIso: string): number {
  const a = new Date(startIso + "T00:00:00Z").getTime();
  const b = new Date(endIso + "T00:00:00Z").getTime();
  return Math.round((b - a) / 86400000);
}
function clampMin(iso: string): string {
  return iso < EKYTE_DATA_MIN ? EKYTE_DATA_MIN : iso;
}
function clampMax(iso: string): string {
  return iso > EKYTE_DATA_MAX ? EKYTE_DATA_MAX : iso;
}

export const EKYTE_PERIOD_OPTIONS = [
  { value: "7d", label: "Últimos 7 dias" },
  { value: "30d", label: "Últimos 30 dias" },
  { value: "90d", label: "Últimos 90 dias" },
  { value: "month", label: "Este mês" },
  { value: "all", label: "Todo o período" },
] as const;

export function ekytePresetToRange(preset: string): EkyteRange {
  const end = ekyteToday();
  switch (preset) {
    case "7d":
      return { start: addDays(end, -6), end };
    case "90d":
      return { start: clampMin(addDays(end, -89)), end };
    case "month":
      return { start: end.slice(0, 8) + "01", end };
    case "all":
      return { start: EKYTE_DATA_MIN, end: EKYTE_DATA_MAX };
    case "30d":
    default:
      return { start: addDays(end, -29), end };
  }
}

/** Custom `from`/`to` wins when both are present and valid; falls back to the `period` preset. */
export function ekyteRangeFromParams(params: { period?: string; from?: string; to?: string }): EkyteRange {
  if (params.from && params.to && params.from <= params.to) {
    return { start: clampMin(params.from), end: clampMax(params.to) };
  }
  return ekytePresetToRange(params.period ?? "30d");
}

/** The equal-length window immediately before `range` — for the same "vs. período anterior" delta every StatCard elsewhere in the app shows. */
export function ekytePreviousPeriod(range: EkyteRange): EkyteRange {
  const days = diffDays(range.start, range.end) + 1;
  const end = addDays(range.start, -1);
  const start = addDays(end, -(days - 1));
  return { start, end };
}

export async function filterEkyteTasks(range: EkyteRange): Promise<EkyteTask[]> {
  const { tasks } = await getEkyteSnapshot();
  return tasks.filter((t) => t.date >= range.start && t.date <= range.end);
}
export async function filterEkyteTime(range: EkyteRange): Promise<EkyteTimeEntry[]> {
  const { timeTrackings } = await getEkyteSnapshot();
  return timeTrackings.filter((t) => t.date >= range.start && t.date <= range.end);
}

export function isEkyteOverdue(t: EkyteTask): boolean {
  return (t.situation === 10 || t.situation === 20) && t.date < ekyteToday();
}

const FORMAT_RULES: [RegExp, string][] = [
  [/criativo estático|estatico/i, "Criativo estático"],
  [/vídeo|video|reels/i, "Vídeo / Reels"],
  [/calend[aá]rio editorial/i, "Planejamento de conteúdo"],
  [/check-?in/i, "Check-in"],
  [/ads|otimiza[cç][aã]o de campanha|estrutura da conta|tr[aá]fego/i, "Mídia paga"],
  [/reuni/i, "Reunião"],
  [/tarefa avulsa/i, "Tarefa avulsa"],
  [/report|kpi|analis|monitor|csat|nps|okr/i, "Análise & relatório"],
];
export function ekyteFormatBucket(type: string): string {
  for (const [re, label] of FORMAT_RULES) if (re.test(type)) return label;
  return "Outros";
}

export type AggPoint = { label: string; value: number };

export function ekyteClientAgg(tasks: EkyteTask[]): AggPoint[] {
  const m = new Map<string, number>();
  for (const t of tasks) m.set(t.client, (m.get(t.client) ?? 0) + 1);
  return [...m.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

export function ekyteFormatAgg(tasks: EkyteTask[]): AggPoint[] {
  const m = new Map<string, number>();
  for (const t of tasks) {
    const b = ekyteFormatBucket(t.type);
    m.set(b, (m.get(b) ?? 0) + 1);
  }
  return [...m.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

export type ExecAggRow = {
  name: string;
  total: number;
  active: number; // ativa/pausada, ainda dentro do prazo
  late: number; // ativa/pausada e atrasada
  done: number;
  minutes: number; // horas apontadas no período (de EKYTE_TIME, não de EKYTE_TASKS.act)
};

export function ekyteExecAgg(tasks: EkyteTask[], time: EkyteTimeEntry[]): ExecAggRow[] {
  const names = new Set<string>([...tasks.map((t) => t.executor), ...time.map((t) => t.executor)]);
  const rows = [...names].map((name) => {
    const own = tasks.filter((t) => t.executor === name);
    const late = own.filter(isEkyteOverdue).length;
    const active = own.filter((t) => (t.situation === 10 || t.situation === 20) && !isEkyteOverdue(t)).length;
    const done = own.filter((t) => t.situation === 30).length;
    const minutes = time.filter((t) => t.executor === name).reduce((a, b) => a + b.minutes, 0);
    return { name, total: own.length, active, late, done, minutes };
  });
  return rows.sort((a, b) => b.active + b.late + b.done - (a.active + a.late + a.done));
}

export type WeekAggRow = { weekStart: string; open: number; done: number; late: number; cancel: number };

function mondayOf(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  const day = d.getUTCDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

export function ekyteWeeklyAgg(tasks: EkyteTask[]): WeekAggRow[] {
  const buckets = new Map<string, WeekAggRow>();
  for (const t of tasks) {
    const wk = mondayOf(t.date);
    if (!buckets.has(wk)) buckets.set(wk, { weekStart: wk, open: 0, done: 0, late: 0, cancel: 0 });
    const b = buckets.get(wk)!;
    if (t.situation === 30) b.done++;
    else if (t.situation === 40) b.cancel++;
    else if (isEkyteOverdue(t)) b.late++;
    else b.open++;
  }
  return [...buckets.values()].sort((a, b) => (a.weekStart < b.weekStart ? -1 : 1));
}

/** Per-teammate accent — reuses the Controle de SLA colors for people who appear in both (Mônica,
 *  Pedro), adds fresh ones for Ekyte-only names so no two people on the same chart share a hue. */
export const EKYTE_PERSON_COLOR: Record<string, string> = {
  "Monica Betim": "var(--c-monica)",
  "Pedro Vytor": "var(--c-pedro)",
  "Mateus Pereira": "var(--c-mateus)",
  "Everton Matheus": "var(--c-everton)",
  "Lucas Soares": "var(--c-lucas)",
  "Flavia Almeida": "var(--c-flavia)",
  "Anderson Matheus": "var(--c-anderson)",
};
export function ekytePersonColor(name: string): string {
  return EKYTE_PERSON_COLOR[name] ?? "var(--color-muted-2)";
}

// Ekyte spells a couple of names slightly differently than the canonical TeamMember roster
// (missing accent, one-letter typo) — same people, used to match Ekyte's `executor` strings back
// to a TeamMember.name when joining the two (see prisma/unify-clients-team.ts, and the Equipes
// detail page, which both need this same mapping).
const EKYTE_EXECUTOR_ALIAS: Record<string, string> = {
  "monica betim": "Mônica Betim",
  "pedro vytor": "Pedro Vyctor",
};
export function ekyteCanonicalName(executor: string): string {
  return EKYTE_EXECUTOR_ALIAS[executor.toLowerCase()] ?? executor;
}

export function ekyteFmtMinutes(min: number): string {
  const m = Math.round(min || 0);
  if (m < 60) return `${m}min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h}h${String(r).padStart(2, "0")}` : `${h}h`;
}
export function ekyteFmtHours(min: number): string {
  return (Math.round((min || 0) / 6) / 10).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}
export function ekytePct(a: number, b: number): number {
  return b ? Math.round((a / b) * 100) : 0;
}
export function ekyteFmtDateShort(iso: string): string {
  const [, mo, d] = iso.split("-");
  return `${d}/${mo}`;
}

export type ClientDetailRow = { client: string; n: number; done: number; late: number; minutes: number };

export function ekyteClientDetail(tasks: EkyteTask[], time: EkyteTimeEntry[]): ClientDetailRow[] {
  return ekyteClientAgg(tasks).map(({ label: client, value: n }) => {
    const own = tasks.filter((t) => t.client === client);
    const done = own.filter((t) => t.situation === 30).length;
    const late = own.filter(isEkyteOverdue).length;
    const minutes = time.filter((t) => t.client === client).reduce((a, b) => a + b.minutes, 0);
    return { client, n, done, late, minutes };
  });
}

/** Plain-language, data-driven callouts for the Relatório page — recomputed for whatever window
 *  the user picks, never hardcoded prose (the numbers would drift out of sync with the period). */
export function ekyteFindings(tasks: EkyteTask[], time: EkyteTimeEntry[]): string[] {
  if (tasks.length === 0) return [];
  const findings: string[] = [];
  const openN = tasks.filter((t) => t.situation === 10 || t.situation === 20).length;
  const late = tasks.filter(isEkyteOverdue).length;
  const lateRate = ekytePct(late, openN);
  if (openN > 0 && lateRate >= 40) {
    findings.push(`Taxa de atraso do período é de ${lateRate}% sobre o que está em aberto (${late} de ${openN}) — acima do saudável para operação corrente.`);
  }
  const exec = ekyteExecAgg(tasks, time);
  const bottleneck = exec.find((r) => r.active + r.late >= 5 && r.done <= 1);
  if (bottleneck) {
    findings.push(`${bottleneck.name} concentra ${bottleneck.active + bottleneck.late} tarefa(s) ativa/atrasada com apenas ${bottleneck.done} concluída(s) no período — possível gargalo de fila.`);
  }
  const clientDetail = ekyteClientDetail(tasks, time).sort((a, b) => b.late - a.late);
  if (clientDetail[0] && clientDetail[0].late > 0) {
    findings.push(`${clientDetail[0].client} é o cliente com mais tarefas atrasadas no período (${clientDetail[0].late}).`);
  }
  const clients = new Set(tasks.map((t) => t.client)).size;
  const formats = new Set(tasks.map((t) => ekyteFormatBucket(t.type))).size;
  const minutes = time.reduce((a, b) => a + b.minutes, 0);
  findings.push(`Produção cobriu ${clients} cliente(s) e ${formats} formato(s) distintos, somando ${ekyteFmtHours(minutes)}h apontadas em ${time.length} registro(s).`);
  return findings;
}
