import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStaffModule } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/audit";

const schema = z.object({ teamMemberId: z.string().min(1), role: z.string().nullish() });

// Read-only lookup used by the Health Score dialog's "Time" section — it renders the client's
// real Equipe links (role per person) instead of duplicating free-text role fields there.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireStaffModule("clientes");
  const { id: clientId } = await params;
  const links = await prisma.clientTeamMember.findMany({
    where: { clientId },
    include: { teamMember: { select: { id: true, name: true, colorVar: true } } },
    orderBy: { teamMember: { name: "asc" } },
  });
  return NextResponse.json({
    team: links.map((l) => ({ id: l.teamMember.id, name: l.teamMember.name, colorVar: l.teamMember.colorVar, role: l.role })),
  });
}

// Links and unlinks are reachable from either side (the client's "Equipe" tab and a teammate's
// "Clientes" tab both call this same route — clientId comes from the URL either way).
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireStaffModule("clientes");
  const { id: clientId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "teamMemberId obrigatório." }, { status: 400 });
  }
  const role = parsed.data.role?.trim() || null;
  await prisma.clientTeamMember.upsert({
    where: { clientId_teamMemberId: { clientId, teamMemberId: parsed.data.teamMemberId } },
    create: { clientId, teamMemberId: parsed.data.teamMemberId, role },
    update: { role },
  });

  const [client, member] = await Promise.all([
    prisma.client.findUnique({ where: { id: clientId }, select: { name: true } }),
    prisma.teamMember.findUnique({ where: { id: parsed.data.teamMemberId }, select: { name: true } }),
  ]);
  await logActivity({
    actorId: actor.id,
    actorName: actor.name,
    action: "vinculou",
    entityType: "Cliente",
    entityId: clientId,
    entityLabel: client?.name ?? clientId,
    detail: `${member?.name ?? parsed.data.teamMemberId} adicionado(a) à equipe do cliente`,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireStaffModule("clientes");
  const { id: clientId } = await params;
  const { searchParams } = new URL(req.url);
  const teamMemberId = searchParams.get("teamMemberId");
  if (!teamMemberId) {
    return NextResponse.json({ error: "teamMemberId obrigatório." }, { status: 400 });
  }
  await prisma.clientTeamMember.deleteMany({ where: { clientId, teamMemberId } });

  const [client, member] = await Promise.all([
    prisma.client.findUnique({ where: { id: clientId }, select: { name: true } }),
    prisma.teamMember.findUnique({ where: { id: teamMemberId }, select: { name: true } }),
  ]);
  await logActivity({
    actorId: actor.id,
    actorName: actor.name,
    action: "desvinculou",
    entityType: "Cliente",
    entityId: clientId,
    entityLabel: client?.name ?? clientId,
    detail: `${member?.name ?? teamMemberId} removido(a) da equipe do cliente`,
  });

  return NextResponse.json({ ok: true });
}
