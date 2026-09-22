import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/audit";

// Deletes Health Score entries that don't correspond to any current Client — leftovers from the
// original spreadsheet import that never matched a real client (duplicate rows, names that don't
// match exactly). The pair to this is /api/admin/health-score/sync, which links/creates entries
// for clients that are missing one; this route removes the other direction.
export async function POST() {
  const actor = await requireAdmin();
  const orphans = await prisma.healthScoreEntry.findMany({ where: { clientId: null }, select: { id: true, clientName: true } });
  if (orphans.length === 0) return NextResponse.json({ removed: 0 });

  await prisma.healthScoreEntry.deleteMany({ where: { clientId: null } });

  await logActivity({
    actorId: actor.id,
    actorName: actor.name,
    action: "excluiu",
    entityType: "Health Score",
    entityId: "purge-orphans",
    entityLabel: "Limpeza de registros sem cliente",
    detail: `${orphans.length} removido(s): ${orphans.map((o) => o.clientName).join(", ")}`,
  });

  return NextResponse.json({ removed: orphans.length });
}
