/**
 * Replaces external picsum.photos placeholder URLs on existing DEMO Meta ads with
 * self-contained SVG data URIs (no external network dependency). Safe to re-run.
 */
import { PrismaClient } from "@prisma/client";
import { generateDemoCreative } from "../src/lib/demo/creative-image";

const prisma = new PrismaClient();

async function main() {
  const ads = await prisma.ad.findMany({
    where: { dataSource: "DEMO", campaign: { adAccount: { platform: "META_ADS" } } },
    include: { campaign: { include: { adAccount: { include: { client: true } } } } },
  });

  let updated = 0;
  for (const ad of ads) {
    const company = ad.campaign.adAccount.client.company;
    const imageUrl = generateDemoCreative(company, ad.id);
    await prisma.ad.update({ where: { id: ad.id }, data: { imageUrl } });
    updated++;
  }

  console.log(`Updated ${updated} demo Meta ad creative images.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
