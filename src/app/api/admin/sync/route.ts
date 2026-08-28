import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { randomDailyMetric, splitAcrossChildren } from "@/lib/demo/generator";
import { generateSearchTermVariants, randomSearchTermStatus, randomSearchTermMetric } from "@/lib/demo/search-terms";
import { generateFunnelCounts } from "@/lib/demo/funnel";
import type { Prisma } from "@prisma/client";

const schema = z.object({ adAccountId: z.string().min(1) });

export async function POST(req: Request) {
  const admin = await requireAdmin();
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "adAccountId obrigatório." }, { status: 400 });
  }

  const account = await prisma.adAccount.findUnique({ where: { id: parsed.data.adAccountId } });
  if (!account) {
    return NextResponse.json({ error: "Conta não encontrada." }, { status: 404 });
  }

  const log = await prisma.syncLog.create({
    data: {
      adAccountId: account.id,
      platform: account.platform,
      status: "RUNNING",
      triggeredById: admin.id,
      dataSource: account.dataSource,
    },
  });

  if (account.dataSource === "REAL") {
    await prisma.syncLog.update({
      where: { id: log.id },
      data: {
        status: "ERROR",
        finishedAt: new Date(),
        errorMessage:
          "Sincronização automática em tempo real requer credenciais oficiais de API (GOOGLE_ADS_* / META_* em .env) ainda não configuradas nesta instância. Até lá, atualize os dados reais desta conta pedindo a uma sessão do Claude Code com os MCPs de Google Ads / Meta Ads conectados para rodar o script prisma/import-real-data.ts.",
      },
    });
    return NextResponse.json({ ok: false, status: "ERROR" });
  }

  // DEMO account: append a fresh, realistic day of metrics across the existing hierarchy.
  const campaigns = await prisma.campaign.findMany({
    where: { adAccountId: account.id },
    include: { adGroups: { include: { ads: true, keywords: true } } },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Only leaf-level rows are ever written: ad-level rows are the source of truth summed by
  // campaign/adGroup/account rollups, and keyword-level rows are a separate dimensional slice
  // used only by the keyword report (see the comment on metricWhere() in lib/data/metrics.ts).
  let recordsSynced = 0;
  for (const campaign of campaigns) {
    const campaignMetric = randomDailyMetric({ platform: account.platform, scale: 1 });

    const perGroup = splitAcrossChildren(campaign.adGroups, campaignMetric);
    for (const { child: adGroup, metric: groupMetric } of perGroup) {
      const perAd = splitAcrossChildren(adGroup.ads, groupMetric);
      for (const { child: ad, metric: adMetric } of perAd) {
        await upsertMetric({ date: today, adAccountId: account.id, campaignId: campaign.id, adGroupId: adGroup.id, adId: ad.id, platform: account.platform, ...adMetric });
        recordsSynced++;
      }

      const perKeyword = splitAcrossChildren(adGroup.keywords, groupMetric);
      for (const { child: keyword, metric: kwMetric } of perKeyword) {
        await upsertMetric({ date: today, adAccountId: account.id, campaignId: campaign.id, adGroupId: adGroup.id, keywordId: keyword.id, platform: account.platform, ...kwMetric });
        recordsSynced++;
      }
    }
  }

  if (account.platform === "GOOGLE_ADS") {
    const periodEnd = today;
    const periodStart = new Date(today);
    periodStart.setDate(periodStart.getDate() - 29);

    for (const campaign of campaigns) {
      await prisma.searchTerm.deleteMany({ where: { campaignId: campaign.id } });
      const rows: Prisma.SearchTermCreateManyInput[] = [];
      for (const adGroup of campaign.adGroups) {
        for (const keyword of adGroup.keywords) {
          for (const text of generateSearchTermVariants(keyword.text, 2 + Math.floor(Math.random() * 2))) {
            rows.push({
              adAccountId: account.id,
              campaignId: campaign.id,
              adGroupId: adGroup.id,
              text,
              status: randomSearchTermStatus(),
              periodStart,
              periodEnd,
              dataSource: "DEMO",
              ...randomSearchTermMetric(20 + Math.random() * 40),
            });
          }
        }
      }
      if (rows.length) await prisma.searchTerm.createMany({ data: rows });
    }

    const existingStages = await prisma.funnelStage.findMany({
      where: { adAccountId: account.id },
      orderBy: { order: "asc" },
      distinct: ["name"],
    });
    if (existingStages.length) {
      const clicksAgg = await prisma.metric.aggregate({
        where: { adAccountId: account.id, keywordId: null },
        _sum: { clicks: true },
      });
      const counts = generateFunnelCounts(clicksAgg._sum.clicks ?? 0, existingStages.length);
      await prisma.funnelStage.deleteMany({ where: { adAccountId: account.id } });
      await prisma.funnelStage.createMany({
        data: existingStages.map((s, i) => ({
          adAccountId: account.id,
          name: s.name,
          order: i,
          conversions: counts[i],
          periodStart,
          periodEnd,
          dataSource: "DEMO",
        })),
      });
    }
  }

  await prisma.adAccount.update({ where: { id: account.id }, data: { lastSyncAt: new Date() } });
  await prisma.syncLog.update({
    where: { id: log.id },
    data: { status: "SUCCESS", finishedAt: new Date(), recordsSynced },
  });

  return NextResponse.json({ ok: true, status: "SUCCESS", recordsSynced });
}

async function upsertMetric(data: {
  date: Date;
  adAccountId: string;
  campaignId?: string;
  adGroupId?: string;
  adId?: string;
  keywordId?: string;
  platform: "GOOGLE_ADS" | "META_ADS";
  impressions: number;
  clicks: number;
  costBrl: number;
  conversions: number;
  conversionValueBrl: number;
  reach?: number | null;
  leads?: number | null;
}) {
  // Composite lookup: keep at most one demo row per (date, entity) so repeated syncs update rather than duplicate.
  const existing = await prisma.metric.findFirst({
    where: {
      date: data.date,
      adAccountId: data.adAccountId,
      campaignId: data.campaignId ?? null,
      adGroupId: data.adGroupId ?? null,
      adId: data.adId ?? null,
      keywordId: data.keywordId ?? null,
    },
  });

  if (existing) {
    await prisma.metric.update({ where: { id: existing.id }, data: { ...data, dataSource: "DEMO" } });
  } else {
    await prisma.metric.create({ data: { ...data, dataSource: "DEMO" } });
  }
}
