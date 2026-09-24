/** One-time import of the V4 service catalog into PortfolioItem — run with `npx tsx prisma/seed-portfolio.ts`.
 *  Safe to re-run: upserts by (service, variation), so editing this list and re-running updates
 *  existing rows instead of duplicating them. Same rows and logic as POST /api/admin/portfolio/seed
 *  (the in-app "Importar catálogo" button on /portfolio) — this script is for local/dev use.
 */
import { PrismaClient } from "@prisma/client";
import { PORTFOLIO_SEED_ROWS } from "../src/lib/portfolio-seed-data";

const prisma = new PrismaClient();

async function main() {
  let created = 0;
  let updated = 0;
  for (const r of PORTFOLIO_SEED_ROWS) {
    const existing = await prisma.portfolioItem.findFirst({
      where: { service: r.service, variation: r.variation },
    });
    if (existing) {
      await prisma.portfolioItem.update({
        where: { id: existing.id },
        data: { category: r.category, valueBrl: r.valueBrl, description: r.description },
      });
      updated++;
    } else {
      await prisma.portfolioItem.create({ data: r });
      created++;
    }
  }
  console.log({ total: PORTFOLIO_SEED_ROWS.length, created, updated });
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
