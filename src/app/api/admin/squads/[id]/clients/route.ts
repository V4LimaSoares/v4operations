import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStaffModule } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/audit";

const schema = z.object({ clientId: z.string().min(1) });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireStaffModule("equipes");
  const { id: squadId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "clientId obrigatório." }, { status: 400 });
  }
  await prisma.squadClient.upsert({
    where: { squadId_clientId: { squadId, clientId: parsed.data.clientId } },
    create: { squadId, clientId: parsed.data.clientId },
    update: {},
  });

  const [squad, client] = await Promise.all([
    prisma.squad.findUnique({ where: { id: squadId }, select: { name: true } }),
    prisma.client.findUnique({ where: { id: parsed.data.clientId }, select: { name: true } }),
  ]);
  await logActivity({
    actorId: actor.id,
    actorName: actor.name,
    action: "vinculou",
    entityType: "Squad",
    entityId: squadId,
    entityLabel: squad?.name ?? squadId,
    detail: `Cliente ${client?.name ?? parsed.data.clientId} adicionado ao squad`,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireStaffModule("equipes");
  const { id: squadId } = await params;
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");
  if (!clientId) {
    return NextResponse.json({ error: "clientId obrigatório." }, { status: 400 });
  }
  await prisma.squadClient.deleteMany({ where: { squadId, clientId } });

  const [squad, client] = await Promise.all([
    prisma.squad.findUnique({ where: { id: squadId }, select: { name: true } }),
    prisma.client.findUnique({ where: { id: clientId }, select: { name: true } }),
  ]);
  await logActivity({
    actorId: actor.id,
    actorName: actor.name,
    action: "desvinculou",
    entityType: "Squad",
    entityId: squadId,
    entityLabel: squad?.name ?? squadId,
    detail: `Cliente ${client?.name ?? clientId} removido do squad`,
  });

  return NextResponse.json({ ok: true });
}
