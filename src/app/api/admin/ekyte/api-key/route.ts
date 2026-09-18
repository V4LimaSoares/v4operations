import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/audit";
import { fetchEkyteTasksFromApi, setEkyteIntegrationStatus } from "@/lib/ekyte-api";

const schema = z.object({ apiKey: z.string().min(10) });

export async function PATCH(req: Request) {
  const actor = await requireAdmin();
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Cole um token válido." }, { status: 400 });
  }

  const existing = await prisma.ekyteIntegration.findFirst();
  if (existing) {
    await prisma.ekyteIntegration.update({
      where: { id: existing.id },
      data: { apiKey: parsed.data.apiKey, updatedByName: actor.name },
    });
  } else {
    await prisma.ekyteIntegration.create({
      data: { apiKey: parsed.data.apiKey, updatedByName: actor.name },
    });
  }

  await logActivity({
    actorId: actor.id,
    actorName: actor.name,
    action: "editou",
    entityType: "Ekyte",
    entityId: "integration",
    entityLabel: "Token de acesso",
    detail: "Token da API atualizado",
  });

  // Test the newly saved token right away, so the banner clears immediately if it works instead
  // of waiting for the next scheduled/manual refresh.
  try {
    await fetchEkyteTasksFromApi();
    await setEkyteIntegrationStatus("OK", null);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Falha ao testar o token.";
    await setEkyteIntegrationStatus("ERROR", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
