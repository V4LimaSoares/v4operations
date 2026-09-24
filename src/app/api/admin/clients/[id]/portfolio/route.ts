import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStaffModule } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/audit";

const schema = z.object({ itemId: z.string().min(1) });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireStaffModule("clientes");
  const { id: clientId } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "itemId obrigatório." }, { status: 400 });
  }
  await prisma.clientPortfolioItem.upsert({
    where: { clientId_itemId: { clientId, itemId: parsed.data.itemId } },
    create: { clientId, itemId: parsed.data.itemId },
    update: {},
  });

  const [client, item] = await Promise.all([
    prisma.client.findUnique({ where: { id: clientId }, select: { name: true } }),
    prisma.portfolioItem.findUnique({ where: { id: parsed.data.itemId }, select: { service: true, variation: true } }),
  ]);
  await logActivity({
    actorId: actor.id,
    actorName: actor.name,
    action: "vinculou",
    entityType: "Cliente",
    entityId: clientId,
    entityLabel: client?.name ?? clientId,
    detail: `${item?.service ?? parsed.data.itemId}${item?.variation ? ` (${item.variation})` : ""} adicionado ao portfólio do cliente`,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireStaffModule("clientes");
  const { id: clientId } = await params;
  const { searchParams } = new URL(req.url);
  const itemId = searchParams.get("itemId");
  if (!itemId) {
    return NextResponse.json({ error: "itemId obrigatório." }, { status: 400 });
  }
  await prisma.clientPortfolioItem.deleteMany({ where: { clientId, itemId } });

  const [client, item] = await Promise.all([
    prisma.client.findUnique({ where: { id: clientId }, select: { name: true } }),
    prisma.portfolioItem.findUnique({ where: { id: itemId }, select: { service: true, variation: true } }),
  ]);
  await logActivity({
    actorId: actor.id,
    actorName: actor.name,
    action: "desvinculou",
    entityType: "Cliente",
    entityId: clientId,
    entityLabel: client?.name ?? clientId,
    detail: `${item?.service ?? itemId}${item?.variation ? ` (${item.variation})` : ""} removido do portfólio do cliente`,
  });

  return NextResponse.json({ ok: true });
}
