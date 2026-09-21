import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStaffModule } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/audit";

const schema = z.object({ teamMemberId: z.string().min(1), role: z.string().nullish() });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireStaffModule("equipes");
  const { id: squadId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "teamMemberId obrigatório." }, { status: 400 });
  }
  const role = parsed.data.role?.trim() || null;
  await prisma.squadMember.upsert({
    where: { squadId_teamMemberId: { squadId, teamMemberId: parsed.data.teamMemberId } },
    create: { squadId, teamMemberId: parsed.data.teamMemberId, role },
    update: { role },
  });

  // Designate this person on every client the squad already manages (existing links untouched).
  const [squadClients, person] = await Promise.all([
    prisma.squadClient.findMany({ where: { squadId }, select: { clientId: true } }),
    prisma.teamMember.findUnique({ where: { id: parsed.data.teamMemberId }, select: { role: true } }),
  ]);
  for (const c of squadClients) {
    await prisma.clientTeamMember.upsert({
      where: { clientId_teamMemberId: { clientId: c.clientId, teamMemberId: parsed.data.teamMemberId } },
      create: { clientId: c.clientId, teamMemberId: parsed.data.teamMemberId, role: role ?? person?.role ?? null },
      update: {},
    });
  }

  const [squad, member] = await Promise.all([
    prisma.squad.findUnique({ where: { id: squadId }, select: { name: true } }),
    prisma.teamMember.findUnique({ where: { id: parsed.data.teamMemberId }, select: { name: true } }),
  ]);
  await logActivity({
    actorId: actor.id,
    actorName: actor.name,
    action: "vinculou",
    entityType: "Squad",
    entityId: squadId,
    entityLabel: squad?.name ?? squadId,
    detail: `${member?.name ?? parsed.data.teamMemberId} adicionado(a) ao squad`,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireStaffModule("equipes");
  const { id: squadId } = await params;
  const { searchParams } = new URL(req.url);
  const teamMemberId = searchParams.get("teamMemberId");
  if (!teamMemberId) {
    return NextResponse.json({ error: "teamMemberId obrigatório." }, { status: 400 });
  }
  await prisma.squadMember.deleteMany({ where: { squadId, teamMemberId } });

  const [squad, member] = await Promise.all([
    prisma.squad.findUnique({ where: { id: squadId }, select: { name: true } }),
    prisma.teamMember.findUnique({ where: { id: teamMemberId }, select: { name: true } }),
  ]);
  await logActivity({
    actorId: actor.id,
    actorName: actor.name,
    action: "desvinculou",
    entityType: "Squad",
    entityId: squadId,
    entityLabel: squad?.name ?? squadId,
    detail: `${member?.name ?? teamMemberId} removido(a) do squad`,
  });

  return NextResponse.json({ ok: true });
}
