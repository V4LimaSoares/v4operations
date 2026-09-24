import { NextResponse } from "next/server";
import { requireStaffModule } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/audit";
import { PORTFOLIO_SEED_ROWS } from "@/lib/portfolio-seed-data";

// Same catalog import used locally by prisma/seed-portfolio.ts, reachable from the "Importar
// catálogo" button on /portfolio so it can be run against production without shell/DB access.
// Upserts by (service, variation): safe to click again, never duplicates.
export async function POST() {
  const actor = await requireStaffModule("portfolio");

  let created = 0;
  let updated = 0;
  for (const r of PORTFOLIO_SEED_ROWS) {
    const existing = await prisma.portfolioItem.findFirst({
      where: { service: r.service, variation: r.variation },
    });
    if (existing) {
      await prisma.portfolioItem.update({
        where: { id: existing.id },
        data: { category: r.category, valueBrl: r.valueBrl, description: r.description, updatedByName: actor.name },
      });
      updated++;
    } else {
      await prisma.portfolioItem.create({ data: { ...r, updatedByName: actor.name } });
      created++;
    }
  }

  if (created + updated > 0) {
    await logActivity({
      actorId: actor.id,
      actorName: actor.name,
      action: "criou",
      entityType: "Portfólio",
      entityId: "seed",
      entityLabel: "Importação do catálogo",
      detail: `${created} criados, ${updated} atualizados`,
    });
  }

  return NextResponse.json({ created, updated, total: PORTFOLIO_SEED_ROWS.length });
}
