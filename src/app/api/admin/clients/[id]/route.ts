import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStaffModule } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/audit";

const schema = z.object({
  name: z.string().min(2).optional(),
  company: z.string().min(2).optional(),
  status: z.enum(["ACTIVE", "PAUSED", "INACTIVE"]).optional(),
  notes: z.string().nullish(),
  slaGroupName: z.string().nullish(),
  ekyteClientName: z.string().nullish(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireStaffModule("clientes");
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const client = await prisma.client.update({ where: { id }, data: parsed.data });

  if (parsed.data.status) {
    await prisma.user.updateMany({
      where: { clientId: id },
      data: { active: parsed.data.status !== "INACTIVE" },
    });
  }

  await logActivity({
    actorId: actor.id,
    actorName: actor.name,
    action: "editou",
    entityType: "Cliente",
    entityId: client.id,
    entityLabel: client.name,
  });

  return NextResponse.json({ ok: true, client });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireStaffModule("clientes");
  const { id } = await params;
  const client = await prisma.client.delete({ where: { id } });

  await logActivity({
    actorId: actor.id,
    actorName: actor.name,
    action: "excluiu",
    entityType: "Cliente",
    entityId: client.id,
    entityLabel: client.name,
  });

  return NextResponse.json({ ok: true });
}
