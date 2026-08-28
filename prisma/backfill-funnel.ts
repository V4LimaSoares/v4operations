/**
 * Backfills funnel stages for existing DEMO Google Ads accounts, matched to each client's
 * segment by company name (mirrors the DEMO_CLIENTS list in seed.ts). Safe to re-run.
 */
import { PrismaClient } from "@prisma/client";
import { FUNNEL_STAGE_NAMES, generateFunnelCounts } from "../src/lib/demo/funnel";

const prisma = new PrismaClient();

const COMPANY_SEGMENT: Record<string, string> = {
  "Loja Aurora Modas": "moda",
  "Clínica Vitalis": "saúde",
  "Construtora Horizonte": "construção",
};

async function main() {
  const accounts = await prisma.adAccount.findMany({
    where: { platform: "GOOGLE_ADS", dataSource: "DEMO" },
    include: { client: { select: { company: true } } },
  });

  const periodEnd = new Date();
  periodEnd.setHours(0, 0, 0, 0);
  const periodStart = new Date(periodEnd);
  periodStart.setDate(periodStart.getDate() - 59);

  let created = 0;
  for (const account of accounts) {
    const segment = COMPANY_SEGMENT[account.client.company];
    const stageNames = segment ? FUNNEL_STAGE_NAMES[segment] : undefined;
    if (!stageNames) continue;

    await prisma.funnelStage.deleteMany({ where: { adAccountId: account.id } });

    const clicksAgg = await prisma.metric.aggregate({
      where: { adAccountId: account.id, keywordId: null },
      _sum: { clicks: true },
    });
    const counts = generateFunnelCounts(clicksAgg._sum.clicks ?? 0, stageNames.length);

    await prisma.funnelStage.createMany({
      data: stageNames.map((name, i) => ({
        adAccountId: account.id,
        name,
        order: i,
        conversions: counts[i],
        periodStart,
        periodEnd,
        dataSource: "DEMO",
      })),
    });
    created += stageNames.length;
  }

  console.log(`Backfilled ${created} funnel stages across ${accounts.length} Google Ads demo accounts.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
