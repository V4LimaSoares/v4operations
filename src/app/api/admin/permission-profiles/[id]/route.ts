import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { isModuleKey } from "@/lib/permissions";
import { logActivity } from "@/lib/audit";

const schema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().nullish(),
  modules: z.array(z.string()).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireAdmin();
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  }
  const { modules, ...rest } = parsed.data;
  const profile = await prisma.permissionProfile.update({
    where: { id },
    data: { ...rest, ...(modules && { modules: modules.filter(isModuleKey) }) },
  });

  await logActivity({
    actorId: actor.id,
    actorName: actor.name,
    action: "editou",
    entityType: "Perfil de permissão",
    entityId: profile.id,
    entityLabel: profile.name,
  });

  return NextResponse.json({ ok: true, profile });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireAdmin();
  const { id } = await params;
  const profile = await prisma.permissionProfile.findUnique({ where: { id } });
  if (profile?.isSystem) {
    return NextResponse.json({ error: "Perfis padrão do sistema não podem ser excluídos." }, { status: 400 });
  }
  await prisma.permissionProfile.delete({ where: { id } });

  await logActivity({
    actorId: actor.id,
    actorName: actor.name,
    action: "excluiu",
    entityType: "Perfil de permissão",
    entityId: id,
    entityLabel: profile?.name ?? id,
  });

  return NextResponse.json({ ok: true });
}
