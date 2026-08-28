import "server-only";
import { prisma } from "@/lib/prisma";
import { presetToRange, getPreviousPeriod, getMetricsSummary, getCampaignPerformance } from "@/lib/data/metrics";
import type { InsightCategory, Platform } from "@prisma/client";
import { pctChange } from "@/lib/utils";

type Draft = {
  category: InsightCategory;
  title: string;
  description: string;
  platform?: Platform;
};

const PLATFORM_LABEL: Record<Platform, string> = {
  GOOGLE_ADS: "Google Ads",
  META_ADS: "Meta Ads",
};

/**
 * Rule-based insight generator (no LLM call): compares the last 7 days against
 * the prior 7 days per platform and per campaign for a single client, and
 * flags the patterns an account manager would call out in a weekly review.
 * Replaces the client's current insight set on every run.
 */
export async function generateInsightsForClient(clientId: string) {
  const range = presetToRange("7d");
  const previous = getPreviousPeriod(range);
  const drafts: Draft[] = [];

  const account = { clientId: true } as const;
  const platforms: Platform[] = ["GOOGLE_ADS", "META_ADS"];

  const hasAnyAccount = await prisma.adAccount.findFirst({ where: { clientId } });
  if (!hasAnyAccount) {
    return { generated: 0 };
  }

  for (const platform of platforms) {
    const accounts = await prisma.adAccount.count({ where: { clientId, platform } });
    if (accounts === 0) continue;

    const [current, prior] = await Promise.all([
      getMetricsSummary({ clientId, isAggregate: false }, range, platform),
      getMetricsSummary({ clientId, isAggregate: false }, previous, platform),
    ]);

    if (current.costBrl === 0 && prior.costBrl === 0) continue;

    const convChange = pctChange(current.conversions, prior.conversions);
    const costChange = pctChange(current.costBrl, prior.costBrl);
    const cpaChange = pctChange(current.cpa, prior.cpa);
    const label = PLATFORM_LABEL[platform];

    if (convChange !== null && convChange >= 15) {
      drafts.push({
        category: "OPPORTUNITY",
        platform,
        title: `${label} com crescimento em conversões`,
        description: `${label} apresentou aumento de ${convChange.toFixed(0)}% nas conversões nos últimos 7 dias em relação ao período anterior (${prior.conversions.toFixed(0)} → ${current.conversions.toFixed(0)}).`,
      });
    } else if (convChange !== null && convChange <= -15) {
      drafts.push({
        category: "PROBLEM",
        platform,
        title: `Queda de conversões em ${label}`,
        description: `${label} teve queda de ${Math.abs(convChange).toFixed(0)}% nas conversões nos últimos 7 dias em relação ao período anterior (${prior.conversions.toFixed(0)} → ${current.conversions.toFixed(0)}).`,
      });
    }

    if (cpaChange !== null && cpaChange >= 18) {
      drafts.push({
        category: "PROBLEM",
        platform,
        title: `CPA subiu em ${label}`,
        description: `O custo por conversão em ${label} aumentou ${cpaChange.toFixed(0)}% nos últimos 7 dias (de R$ ${prior.cpa.toFixed(2)} para R$ ${current.cpa.toFixed(2)}).`,
      });
    } else if (cpaChange !== null && cpaChange <= -15 && current.conversions > 0) {
      drafts.push({
        category: "HIGHLIGHT",
        platform,
        title: `CPA melhorou em ${label}`,
        description: `O custo por conversão em ${label} caiu ${Math.abs(cpaChange).toFixed(0)}% nos últimos 7 dias (de R$ ${prior.cpa.toFixed(2)} para R$ ${current.cpa.toFixed(2)}).`,
      });
    }

    if (costChange !== null && costChange >= 20 && (convChange === null || convChange < costChange / 2)) {
      drafts.push({
        category: "ATTENTION",
        platform,
        title: `Investimento cresceu mais que os resultados em ${label}`,
        description: `O investimento em ${label} aumentou ${costChange.toFixed(0)}% nos últimos 7 dias, enquanto as conversões cresceram ${convChange === null ? "de forma não comparável" : `apenas ${convChange.toFixed(0)}%`}. Vale revisar se o incremento de verba está performando.`,
      });
    }

    if (current.costBrl > 50 && current.conversions === 0) {
      drafts.push({
        category: "PROBLEM",
        platform,
        title: `Investimento sem conversões em ${label}`,
        description: `${label} investiu R$ ${current.costBrl.toFixed(2)} nos últimos 7 dias sem registrar nenhuma conversão. Recomenda-se revisar segmentação, criativos ou tracking de conversão.`,
      });
    }

    if (current.roas >= 4 && current.costBrl > 0) {
      drafts.push({
        category: "HIGHLIGHT",
        platform,
        title: `${label} com ROAS acima de 4x`,
        description: `${label} entregou ROAS de ${current.roas.toFixed(1)}x nos últimos 7 dias — bem acima da média de 2-3x considerada saudável para a maioria dos negócios.`,
      });
    }
  }

  // Campaign-level: best ROAS of the period, and campaigns whose spend is up but conversions flat.
  const campaigns = await getCampaignPerformance({ clientId, isAggregate: false }, range, "all");
  const withSpend = campaigns.filter((c) => c.costBrl > 0);
  if (withSpend.length > 0) {
    const best = [...withSpend].sort((a, b) => b.roas - a.roas)[0];
    if (best.roas > 0) {
      drafts.push({
        category: "HIGHLIGHT",
        platform: best.platform,
        title: `Campanha "${best.name}" lidera o ROAS`,
        description: `A campanha "${best.name}" (${PLATFORM_LABEL[best.platform]}) possui o melhor ROAS do período, com retorno de ${best.roas.toFixed(1)}x sobre o investimento.`,
      });
    }

    const worstCpa = [...withSpend]
      .filter((c) => c.conversions > 0)
      .sort((a, b) => b.cpa - a.cpa)[0];
    if (worstCpa && worstCpa.cpa > 0) {
      drafts.push({
        category: "ATTENTION",
        platform: worstCpa.platform,
        title: `Campanha "${worstCpa.name}" com CPA elevado`,
        description: `A campanha "${worstCpa.name}" (${PLATFORM_LABEL[worstCpa.platform]}) está com o maior custo por conversão do período: R$ ${worstCpa.cpa.toFixed(2)}.`,
      });
    }
  }

  // Revenue tracking gap — be explicit about API limitations rather than inventing numbers.
  const hasRevenue = await prisma.revenueEntry.findFirst({ where: { clientId } });
  if (!hasRevenue) {
    drafts.push({
      category: "ATTENTION",
      title: "Faturamento ainda não conectado",
      description:
        "As APIs de Google Ads e Meta Ads não fornecem dados de faturamento real da empresa — apenas valor de conversão reportado pelo pixel/tag. Cadastre o faturamento manualmente na página Faturamento, ou conecte uma integração de e-commerce/CRM, para ROAS e ticket médio refletirem a receita real.",
    });
  }

  if (drafts.length === 0) {
    drafts.push({
      category: "ATTENTION",
      title: "Sem variações relevantes no período",
      description: "Não foram identificadas variações acima dos limiares configurados nos últimos 7 dias em relação ao período anterior.",
    });
  }

  await prisma.$transaction([
    prisma.insight.deleteMany({ where: { clientId } }),
    prisma.insight.createMany({
      data: drafts.map((d) => ({
        clientId,
        category: d.category,
        title: d.title,
        description: d.description,
        platform: d.platform,
        dataSource: "DEMO" as const,
      })),
    }),
  ]);

  // Reflect the actual data source mix (REAL if any underlying account for this client is REAL).
  const realAccount = await prisma.adAccount.findFirst({ where: { clientId, dataSource: "REAL" } });
  if (realAccount) {
    await prisma.insight.updateMany({ where: { clientId }, data: { dataSource: "REAL" } });
  }

  return { generated: drafts.length };
}

export async function generateInsightsForAllClients() {
  const clients = await prisma.client.findMany({ select: { id: true } });
  let total = 0;
  for (const c of clients) {
    const res = await generateInsightsForClient(c.id);
    total += res.generated;
  }
  return { clients: clients.length, insights: total };
}
