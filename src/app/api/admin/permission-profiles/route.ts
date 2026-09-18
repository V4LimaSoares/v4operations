import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { isModuleKey } from "@/lib/permissions";
import { logActivity } from "@/lib/audit";

const schema = z.object({
  name: z.string().min(2),
  description: z.string().nullish(),
  modules: z.array(z.string()).default([]),
});

export async function POST(req: Request) {
  const actor = await requireAdmin();
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  }
  const existing = await prisma.permissionProfile.findUnique({ where: { name: parsed.data.name } });
  if (existing) {
    return NextResponse.json({ error: "Já existe um perfil com esse nome." }, { status: 409 });
  }
  const profile = await prisma.permissionProfile.create({
    data: { ...parsed.data, modules: parsed.data.modules.filter(isModuleKey) },
  });

  await logActivity({
    actorId: actor.id,
    actorName: actor.name,
    action: "criou",
    entityType: "Perfil de permissão",
    entityId: profile.id,
    entityLabel: profile.name,
  });

  return NextResponse.json({ ok: true, profile });
}
