import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/audit";

// Keeps the "Clientes" and "Health Score" tabs in sync (see (app)/clientes/page.tsx): every
// Client must have at least one HealthScoreEntry. New clients get one automatically on creation
// (see api/admin/clients/route.ts) — this route is the manual catch-up for whatever slipped
// through before that existed, or from a spreadsheet import that added clients another way.
export async function POST() {
  const actor = await requireAdmin();
  const clients = await prisma.client.findMany({ select: { id: true, name: true } });

  let linked = 0;
  let created = 0;
  for (const c of clients) {
    const has = await prisma.healthScoreEntry.findFirst({ where: { clientId: c.id } });
    if (has) continue;

    const orphan = await prisma.healthScoreEntry.findFirst({
      where: { clientId: null, clientName: { equals: c.name, mode: "insensitive" } },
    });
    if (orphan) {
      await prisma.healthScoreEntry.update({ where: { id: orphan.id }, data: { clientId: c.id, clientName: c.name } });
      linked++;
    } else {
      await prisma.healthScoreEntry.create({ data: { clientId: c.id, clientName: c.name, phase: "ONGOING" } });
      created++;
    }
  }

  if (linked + created > 0) {
    await logActivity({
      actorId: actor.id,
      actorName: actor.name,
      action: "editou",
      entityType: "Health Score",
      entityId: "sync",
      entityLabel: "Sincronização com Clientes",
      detail: `${linked} vinculados a registros existentes, ${created} criados`,
    });
  }

  return NextResponse.json({ linked, created });
}
