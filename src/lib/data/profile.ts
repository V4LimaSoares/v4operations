import "server-only";
import { prisma } from "@/lib/prisma";

/** Everything Perfil shows about the signed-in account — deliberately different data than
 *  Configurações (which only has account fields + password): this is the person's footprint in
 *  the rest of the app — their Equipes/Squad profile if any, and real activity they've generated
 *  (Account notes authored, syncs they've triggered), not fabricated stats. */
export async function getProfileData(userId: string) {
  const [teamMemberProfile, notes, syncs, notesCount, syncsCount] = await Promise.all([
    prisma.teamMember.findUnique({
      where: { userId },
      include: {
        squads: { include: { squad: { select: { id: true, name: true } } } },
        _count: { select: { clients: true } },
      },
    }),
    prisma.accountNote.findMany({
      where: { authorId: userId },
      orderBy: { occurredAt: "desc" },
      take: 5,
      select: { id: true, type: true, body: true, occurredAt: true, client: { select: { id: true, name: true } } },
    }),
    prisma.syncLog.findMany({
      where: { triggeredById: userId },
      orderBy: { startedAt: "desc" },
      take: 5,
      select: {
        id: true,
        platform: true,
        status: true,
        startedAt: true,
        recordsSynced: true,
        adAccount: { select: { name: true } },
      },
    }),
    prisma.accountNote.count({ where: { authorId: userId } }),
    prisma.syncLog.count({ where: { triggeredById: userId } }),
  ]);

  return { teamMemberProfile, notes, syncs, notesCount, syncsCount };
}
