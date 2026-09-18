import { formatBRL, formatPercent, formatDate } from "@/lib/utils";

/** PT-BR labels for every diffable Health Score field — used to render "Campo: antes → depois"
 *  lines in the change history shown inside the (locked) view of HealthScoreDialog. */
const FIELD_LABELS: Record<string, string> = {
  clientName: "Cliente",
  phase: "Fase",
  productCategory: "Categoria do produto",
  product: "Produto",
  feeBrl: "Fee mensal",
  projectStart: "Data de início",
  leadTimeMonths: "LT (meses)",
  replanDate: "Replanejamento",
  lastUpdate: "Última atualização",
  contributionMarginPct: "Margem de contribuição",
  roi: "ROI",
  revenueGoalBrl: "Meta de faturamento",
  revenueAchievedBrl: "Faturamento realizado",
  investmentGoalBrl: "Meta de investimento",
  investmentAchievedBrl: "Investimento realizado",
  planningLink: "Link do planejamento",
  kpiGoal: "Meta de KPI",
  kpiPartial: "KPI parcial",
  kpiAchieved: "KPI atingido",
  stakeholderRelationship: "Relacionamento",
  flag: "Flag",
  hsUpToDate: "Health Score em dia",
  accountOwner: "Responsável interno",
  nextCheckin: "Próximo check-in",
  checklist: "Checklist de saúde da conta",
  growth: "Resultado",
  churnProbabilityPct: "Probabilidade de churn",
  fact: "Fato",
  cause: "Causa",
  action: "Ação",
  notes: "Observações",
  endDate: "Data de fim",
  contractLink: "Contrato",
  analysisFrequency: "Periodicidade da análise",
  paidMediaInvestmentBrl: "Investimento mídia paga",
  driveLink: "Drive",
};

const CURRENCY_FIELDS = new Set([
  "feeBrl",
  "revenueGoalBrl",
  "revenueAchievedBrl",
  "investmentGoalBrl",
  "investmentAchievedBrl",
  "paidMediaInvestmentBrl",
]);
const PERCENT_FIELDS = new Set(["contributionMarginPct", "churnProbabilityPct"]);
const DATE_FIELDS = new Set(["projectStart", "replanDate", "lastUpdate", "nextCheckin", "endDate"]);
const BOOL_FIELDS = new Set(["kpiAchieved"]);

function formatValue(key: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "vazio";
  if (CURRENCY_FIELDS.has(key)) return formatBRL(value as number);
  if (PERCENT_FIELDS.has(key)) return formatPercent(value as number);
  if (DATE_FIELDS.has(key)) {
    const d = value instanceof Date ? value : new Date(value as string);
    return isNaN(d.getTime()) ? "vazio" : formatDate(d);
  }
  if (BOOL_FIELDS.has(key)) return value ? "Sim" : "Não";
  if (key === "checklist") return "atualizado";
  return String(value);
}

/** Normalizes a raw field value to a comparable string — Date objects and ISO strings for the
 *  same date must compare equal, `null`/`undefined`/`""` must all compare equal (empty). */
function normalize(key: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  if (DATE_FIELDS.has(key)) {
    const d = value instanceof Date ? value : new Date(value as string);
    return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
  }
  if (key === "checklist") return JSON.stringify(value ?? {});
  return String(value);
}

/** Compares the field values a PATCH is about to write (`after`) against the row as it was
 *  before (`before`), returning one human-readable "Campo: antes → depois" line per real change.
 *  Only fields present in `after` are considered — unrelated fields never show up as "changed". */
export function diffHealthScoreFields(before: Record<string, unknown>, after: Record<string, unknown>): string[] {
  const changes: string[] = [];
  for (const key of Object.keys(after)) {
    const label = FIELD_LABELS[key];
    if (!label) continue;
    const beforeVal = before[key];
    const afterVal = after[key];
    if (normalize(key, beforeVal) === normalize(key, afterVal)) continue;
    if (key === "checklist") {
      changes.push(`${label} atualizado(a)`);
      continue;
    }
    changes.push(`${label}: ${formatValue(key, beforeVal)} → ${formatValue(key, afterVal)}`);
  }
  return changes;
}
