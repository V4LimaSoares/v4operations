import { NextResponse } from "next/server";
import { requireStaffModule } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/audit";
import { fetchEkyteTasksFromApi, setEkyteIntegrationStatus } from "@/lib/ekyte-api";

export async function POST() {
  const actor = await requireStaffModule("ekyte");

  let tasks;
  try {
    tasks = await fetchEkyteTasksFromApi();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Falha ao buscar dados do Ekyte.";
    await setEkyteIntegrationStatus("ERROR", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
  await setEkyteIntegrationStatus("OK", null);

  // Time-tracking entries aren't available from a direct Ekyte endpoint (see ekyte-api.ts) — carry
  // the previous snapshot's forward instead of losing them on every refresh.
  const previous = await prisma.ekyteSnapshot.findFirst({ orderBy: { generatedAt: "desc" } });

  const snapshot = await prisma.ekyteSnapshot.create({
    data: {
      tasksJson: tasks,
      timeJson: previous?.timeJson ?? [],
    },
  });

  await logActivity({
    actorId: actor.id,
    actorName: actor.name,
    action: "editou",
    entityType: "Ekyte",
    entityId: snapshot.id,
    entityLabel: "Snapshot de tarefas",
    detail: `${tasks.length} tarefas atualizadas`,
  });

  return NextResponse.json({ ok: true, generatedAt: snapshot.generatedAt, taskCount: tasks.length });
}
