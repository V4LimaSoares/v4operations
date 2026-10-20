import { NextResponse } from "next/server";
import { requireStaffModule } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/audit";
import { PORTFOLIO_SEED_ROWS } from "@/lib/portfolio-seed-data";

// Same catalog import used locally by prisma/seed-portfolio.ts, reachable from the "Importar
// catálogo" button on /portfolio so it can be run against production without shell/DB access.
// Só CRIA o que falta, por (service, variation): clicar de novo nunca duplica e NUNCA sobrescreve
// o que alguém já editou no sistema (valor, descrição, categoria) — o catálogo do código é só ponto
// de partida, a edição feita no ar é a verdade.
export async function POST() {
  const actor = await requireStaffModule("portfolio");

  let created = 0;
  let updated = 0;
  for (const r of PORTFOLIO_SEED_ROWS) {
    const existing = await prisma.portfolioItem.findFirst({
      where: { service: r.service, variation: r.variation },
    });
    if (existing) {
      updated++; // já existe: preservado como está
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
      detail: `${created} criados, ${updated} já existentes (preservados)`,
    });
  }

  return NextResponse.json({ created, updated, total: PORTFOLIO_SEED_ROWS.length });
}
