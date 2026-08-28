/**
 * Backfills the Search Terms report for existing DEMO Google Ads campaigns (search terms are
 * a Google Ads-only report). Safe to re-run: replaces each campaign's search terms wholesale,
 * matching how a real sync would refresh the snapshot for a period.
 */
import { PrismaClient, type Prisma } from "@prisma/client";
import { generateSearchTermVariants, randomSearchTermStatus, randomSearchTermMetric } from "../src/lib/demo/search-terms";

const prisma = new PrismaClient();

async function main() {
  const campaigns = await prisma.campaign.findMany({
    where: { adAccount: { platform: "GOOGLE_ADS", dataSource: "DEMO" } },
    include: { adGroups: { include: { keywords: true } } },
  });

  const periodEnd = new Date();
  periodEnd.setHours(0, 0, 0, 0);
  const periodStart = new Date(periodEnd);
  periodStart.setDate(periodStart.getDate() - 29);

  let total = 0;
  for (const campaign of campaigns) {
    await prisma.searchTerm.deleteMany({ where: { campaignId: campaign.id } });

    const rows: Prisma.SearchTermCreateManyInput[] = [];
    for (const adGroup of campaign.adGroups) {
      for (const keyword of adGroup.keywords) {
        const variants = generateSearchTermVariants(keyword.text, 2 + Math.floor(Math.random() * 2));
        for (const text of variants) {
          const metric = randomSearchTermMetric(20 + Math.random() * 40);
          rows.push({
            adAccountId: campaign.adAccountId,
            campaignId: campaign.id,
            adGroupId: adGroup.id,
            text,
            status: randomSearchTermStatus(),
            periodStart,
            periodEnd,
            dataSource: "DEMO",
            ...metric,
          });
        }
      }
    }

    if (rows.length) {
      await prisma.searchTerm.createMany({ data: rows });
      total += rows.length;
    }
  }

  console.log(`Backfilled ${total} search terms across ${campaigns.length} Google Ads demo campaigns.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
