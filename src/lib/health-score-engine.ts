/**
 * Health Score calculado — motor puro (sem banco, sem rede) para ser testável e auditável.
 *
 * Regras (plano de reestruturação, §5):
 *  - Cada dimensão vira nota 0–100 ou null ("sem dado suficiente"), com a lista de indicadores usados.
 *  - Nota geral = média ponderada só das dimensões disponíveis, renormalizada.
 *  - ≥3 dimensões: classificação normal · 2: nota "parcial" (nunca Saudável) · ≤1: dados insuficientes.
 *  - Cliente recém-cadastrado: "em implantação", sem classificação.
 *  - O fee mensal NÃO entra na nota.
 */

export type DimensionKey = "performance" | "atendimento" | "operacao" | "relacionamento";
export const DIMENSION_LABEL: Record<DimensionKey, string> = {
  performance: "Performance",
  atendimento: "Atendimento",
  operacao: "Operação",
  relacionamento: "Relacionamento",
};
export const DIMENSION_KEYS: DimensionKey[] = ["performance", "atendimento", "operacao", "relacionamento"];

export type Indicator = {
  label: string;
  value: string;
  /** Pontos entre 0 e 100 que este indicador atribui à dimensão. */
  points: number;
  /** De onde veio o dado. */
  source: string;
  /** Frase pronta para "por que esta nota", só quando o indicador puxa a nota para baixo. */
  problem?: string;
  /** Ação sugerida associada ao problema. */
  action?: string;
};

export type DimensionResult = { score: number; indicators: Indicator[] } | null;

export type HealthConfig = {
  version: number;
  weights: Record<DimensionKey, number>;
  healthyMin: number;
  attentionMin: number;
  newClientDays: number;
};

export const DEFAULT_CONFIG: HealthConfig = {
  version: 0,
  weights: { performance: 35, atendimento: 25, operacao: 25, relacionamento: 15 },
  healthyMin: 75,
  attentionMin: 50,
  newClientDays: 30,
};

export type Classification = "SAUDAVEL" | "ATENCAO" | "CRITICO" | "INSUFICIENTE" | "IMPLANTACAO";

export const CLASSIFICATION_LABEL: Record<Classification, string> = {
  SAUDAVEL: "Saudável",
  ATENCAO: "Atenção",
  CRITICO: "Crítico",
  INSUFICIENTE: "Dados insuficientes",
  IMPLANTACAO: "Em implantação",
};

export type HealthResult = {
  score: number | null;
  classification: Classification;
  partial: boolean;
  dimensions: Record<DimensionKey, DimensionResult>;
  available: DimensionKey[];
  missing: DimensionKey[];
  problems: string[];
  actions: string[];
};

/** Média simples dos pontos dos indicadores (cada indicador pesa igual dentro da dimensão). */
export function scoreFromIndicators(indicators: Indicator[]): DimensionResult {
  if (indicators.length === 0) return null;
  const score = Math.round(indicators.reduce((a, i) => a + i.points, 0) / indicators.length);
  return { score, indicators };
}

export function computeHealth(
  dimensions: Record<DimensionKey, DimensionResult>,
  config: HealthConfig,
  client: { createdAt: Date; now?: Date }
): HealthResult {
  const now = client.now ?? new Date();
  const available = DIMENSION_KEYS.filter((k) => dimensions[k] !== null);
  const missing = DIMENSION_KEYS.filter((k) => dimensions[k] === null);

  const problems: string[] = [];
  const actions: string[] = [];
  for (const k of available) {
    for (const i of dimensions[k]!.indicators) {
      if (i.problem) problems.push(`${DIMENSION_LABEL[k]}: ${i.problem}`);
      if (i.action && !actions.includes(i.action)) actions.push(i.action);
    }
  }

  const ageDays = (now.getTime() - client.createdAt.getTime()) / 86400000;
  if (ageDays < config.newClientDays) {
    return { score: null, classification: "IMPLANTACAO", partial: false, dimensions, available, missing, problems, actions };
  }

  if (available.length <= 1) {
    return { score: null, classification: "INSUFICIENTE", partial: false, dimensions, available, missing, problems, actions };
  }

  const totalWeight = available.reduce((a, k) => a + (config.weights[k] ?? 0), 0);
  const score =
    totalWeight > 0
      ? Math.round(available.reduce((a, k) => a + dimensions[k]!.score * (config.weights[k] ?? 0), 0) / totalWeight)
      : Math.round(available.reduce((a, k) => a + dimensions[k]!.score, 0) / available.length);

  const partial = available.length < 3;
  let classification: Classification =
    score >= config.healthyMin ? "SAUDAVEL" : score >= config.attentionMin ? "ATENCAO" : "CRITICO";
  // Com só 2 dimensões não é seguro afirmar "Saudável": limita a Atenção.
  if (partial && classification === "SAUDAVEL") classification = "ATENCAO";

  return { score, classification, partial, dimensions, available, missing, problems, actions };
}
