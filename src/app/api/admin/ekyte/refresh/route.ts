import { NextResponse } from "next/server";
import { requireStaffModule } from "@/lib/session";
import { logActivity } from "@/lib/audit";
import { refreshEkyteSnapshot } from "@/lib/ekyte-api";

export async function POST() {
  const actor = await requireStaffModule("ekyte");

  let result;
  try {
    result = await refreshEkyteSnapshot();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Falha ao buscar dados do Ekyte.";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  await logActivity({
    actorId: actor.id,
    actorName: actor.name,
    action: "editou",
    entityType: "Ekyte",
    entityId: result.id,
    entityLabel: "Snapshot de tarefas",
    detail: `${result.taskCount} tarefas atualizadas${result.linked ? `; ${result.linked} cliente(s) vinculado(s) automaticamente` : ""}`,
  });

  return NextResponse.json({ ok: true, generatedAt: result.generatedAt, taskCount: result.taskCount, linked: result.linked });
}
