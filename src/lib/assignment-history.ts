import "server-only";
import { prisma } from "@/lib/prisma";

type Actor = { name: string };

/** Copia os vínculos que estão prestes a ser desfeitos para o histórico (chamar ANTES do delete).
 *  Nunca lança: falhar em registrar o histórico não pode impedir a desvinculação em si. */
export async function recordEndedClientTeam(clientId: string, teamMemberId: string, actor: Actor) {
  try {
    const rows = await prisma.clientTeamMember.findMany({
      where: { clientId, teamMemberId },
      include: { client: { select: { name: true } }, teamMember: { select: { name: true } } },
    });
    if (rows.length === 0) return;
    await prisma.assignmentHistory.createMany({
      data: rows.map((r) => ({
        kind: "CLIENT_TEAM",
        clientId: r.clientId,
        clientName: r.client.name,
        teamMemberId: r.teamMemberId,
        memberName: r.teamMember.name,
        role: r.role,
        startedAt: r.createdAt,
        endedByName: actor.name,
      })),
    });
  } catch (err) {
    console.error("[assignment-history] falha ao registrar:", err);
  }
}

export async function recordEndedSquadMember(squadId: string, teamMemberId: string, actor: Actor) {
  try {
    const rows = await prisma.squadMember.findMany({
      where: { squadId, teamMemberId },
      include: { squad: { select: { name: true } }, teamMember: { select: { name: true } } },
    });
    if (rows.length === 0) return;
    await prisma.assignmentHistory.createMany({
      data: rows.map((r) => ({
        kind: "SQUAD_MEMBER",
        squadId: r.squadId,
        squadName: r.squad.name,
        teamMemberId: r.teamMemberId,
        memberName: r.teamMember.name,
        role: r.role,
        startedAt: r.createdAt,
        endedByName: actor.name,
      })),
    });
  } catch (err) {
    console.error("[assignment-history] falha ao registrar:", err);
  }
}

export async function recordEndedSquadClient(squadId: string, clientId: string, actor: Actor) {
  try {
    const rows = await prisma.squadClient.findMany({
      where: { squadId, clientId },
      include: { squad: { select: { name: true } }, client: { select: { name: true } } },
    });
    if (rows.length === 0) return;
    await prisma.assignmentHistory.createMany({
      data: rows.map((r) => ({
        kind: "SQUAD_CLIENT",
        squadId: r.squadId,
        squadName: r.squad.name,
        clientId: r.clientId,
        clientName: r.client.name,
        startedAt: r.createdAt,
        endedByName: actor.name,
      })),
    });
  } catch (err) {
    console.error("[assignment-history] falha ao registrar:", err);
  }
}
