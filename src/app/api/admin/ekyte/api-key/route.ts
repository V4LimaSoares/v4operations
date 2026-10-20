import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/audit";
import { refreshEkyteSnapshot } from "@/lib/ekyte-api";

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

  // Testa o token novo e, se funcionar, já grava o snapshot: o banner some e os dados (Operação,
  // Health Score) voltam a ser atuais sem depender de alguém clicar em "Atualizar agora".
  try {
    const result = await refreshEkyteSnapshot();
    return NextResponse.json({ ok: true, taskCount: result.taskCount });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Falha ao testar o token.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
