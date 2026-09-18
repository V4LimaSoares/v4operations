import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStaffModule } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/audit";

const schema = z.object({
  name: z.string().min(1).optional(),
  percentage: z.number().min(0).max(100).optional(),
  description: z.string().nullish(),
  active: z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireStaffModule("financeiro");
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  }

  const royalty = await prisma.royaltyConfig.update({ where: { id }, data: parsed.data });

  await logActivity({
    actorId: actor.id,
    actorName: actor.name,
    action: "editou",
    entityType: "Royalty",
    entityId: royalty.id,
    entityLabel: royalty.name,
  });

  return NextResponse.json({ ok: true, royalty });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireStaffModule("financeiro");
  const { id } = await params;
  const royalty = await prisma.royaltyConfig.delete({ where: { id } });

  await logActivity({
    actorId: actor.id,
    actorName: actor.name,
    action: "excluiu",
    entityType: "Royalty",
    entityId: royalty.id,
    entityLabel: royalty.name,
  });

  return NextResponse.json({ ok: true });
}
