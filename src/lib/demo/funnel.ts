export const FUNNEL_STAGE_NAMES: Record<string, string[]> = {
  moda: ["Leads", "Carrinho Iniciado", "Vendas"],
  saúde: ["Leads", "Agendamentos", "Consultas Realizadas"],
  construção: ["Leads", "Visitas Agendadas", "Vendas"],
};

/** Generates plausible, decreasing stage counts from a clicks total (demo data only). */
export function generateFunnelCounts(clicks: number, stageCount: number): number[] {
  let remaining = clicks * (0.08 + Math.random() * 0.1); // ~8-18% of clicks become the first stage
  const counts: number[] = [];
  for (let i = 0; i < stageCount; i++) {
    counts.push(Number(remaining.toFixed(1)));
    remaining *= 0.3 + Math.random() * 0.35; // each next stage keeps 30-65% of the previous
  }
  return counts;
}
