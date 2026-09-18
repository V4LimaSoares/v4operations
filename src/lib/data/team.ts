import "server-only";
import { prisma } from "@/lib/prisma";

export async function listTeamMembers() {
  return prisma.teamMember.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { clients: true } } },
  });
}

export async function getTeamMemberById(id: string) {
  return prisma.teamMember.findUnique({
    where: { id },
    include: {
      clients: {
        include: { client: { select: { id: true, name: true, company: true, status: true } } },
        orderBy: { client: { name: "asc" } },
      },
    },
  });
}

/** Administração users not yet linked to an Equipes roster profile — the pool "Adicionar membro"
 *  offers for its optional "vincular a um usuário" field. CLIENT-role users are excluded; they
 *  belong to their own portal, not the agency roster. */
export async function listAvailableUsersForTeam() {
  return prisma.user.findMany({
    where: { role: { in: ["ADMIN", "STAFF"] }, teamMemberProfile: null },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });
}

/** Equipes roster profiles with no Administração account yet — the pre-migration "legacy"
 *  people, plus the pool Administração's "Novo usuário" picks from when the person being
 *  created already has a profile in Equipes (so it gets linked, not duplicated). */
export async function listUnlinkedTeamMembers() {
  return prisma.teamMember.findMany({
    where: { userId: null },
    select: { id: true, name: true, role: true },
    orderBy: { name: "asc" },
  });
}
