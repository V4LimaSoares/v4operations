import "server-only";
import type { ReportData } from "@/lib/reports/data";

/** Deterministic, rule-based report copy — no LLM call, mirrors the logic in insights-engine.ts. */
export function buildNarrative(data: ReportData) {
  const { current, convChange, costChange, cpaChange, best, worst } = data;

  const leituraExecutiva: string[] = [];
  leituraExecutiva.push(
    `A operação investiu ${formatBRL(current.costBrl)} no período, gerando ${current.conversions.toFixed(1)} conversões a um custo médio de ${formatBRL(current.cpa)} cada.`
  );
  if (convChange !== null) {
    leituraExecutiva.push(
      convChange >= 0
        ? `As conversões cresceram ${convChange.toFixed(0)}% em relação ao período anterior.`
        : `As conversões caíram ${Math.abs(convChange).toFixed(0)}% em relação ao período anterior — vale investigar segmentação e criativos.`
    );
  }
  if (cpaChange !== null && Math.abs(cpaChange) >= 5) {
    leituraExecutiva.push(
      cpaChange > 0
        ? `O custo por conversão subiu ${cpaChange.toFixed(0)}%, o que pede atenção na qualidade do tráfego e nos lances.`
        : `O custo por conversão caiu ${Math.abs(cpaChange).toFixed(0)}%, uma evolução saudável de eficiência.`
    );
  }
  if (current.roas > 0) {
    leituraExecutiva.push(`O ROAS do período foi de ${current.roas.toFixed(2)}x.`);
  }

  const destaques: string[] = [];
  if (best) destaques.push(`A campanha "${best.name}" lidera o ROAS do período, com ${best.roas.toFixed(2)}x de retorno.`);
  if (worst && worst.id !== best?.id) destaques.push(`"${worst.name}" tem o menor ROAS (${worst.roas.toFixed(2)}x) — candidata a revisão.`);
  destaques.push(`CTR médio de ${current.ctr.toFixed(2)}% e CPC médio de ${formatBRL(current.cpc)} no período.`);
  if (data.platforms.google.costBrl > 0 && data.platforms.meta.costBrl > 0) {
    const total = data.platforms.google.costBrl + data.platforms.meta.costBrl;
    destaques.push(
      `Google Ads representa ${((data.platforms.google.costBrl / total) * 100).toFixed(0)}% do investimento; Meta Ads, ${((data.platforms.meta.costBrl / total) * 100).toFixed(0)}%.`
    );
  }

  const proximosPassos: { title: string; description: string }[] = [];
  if (cpaChange !== null && cpaChange > 15) {
    proximosPassos.push({ title: "Revisar lances e segmentação", description: "O CPA subiu de forma relevante — revisar públicos, palavras-chave e estratégia de lance." });
  }
  if (current.conversions === 0) {
    proximosPassos.push({ title: "Checar rastreamento", description: "Nenhuma conversão registrada no período — validar tags/pixels de conversão." });
  }
  if (worst) {
    proximosPassos.push({ title: "Otimizar campanha de menor retorno", description: `Revisar criativos e segmentação de "${worst.name}".` });
  }
  proximosPassos.push({ title: "Testar novos criativos", description: "Renovar anúncios com pior CTR para manter a relevância em alta." });
  proximosPassos.push({ title: "Ampliar o que funciona", description: best ? `Considerar aumento de orçamento em "${best.name}", dado o retorno acima da média.` : "Escalar orçamento nas campanhas com melhor retorno." });

  return {
    leituraExecutiva: leituraExecutiva.join(" "),
    destaques: destaques.slice(0, 4),
    proximosPassos: proximosPassos.slice(0, 4),
  };
}

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
