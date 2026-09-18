import "server-only";
import { prisma } from "@/lib/prisma";

export async function listAccountNotes(clientId: string) {
  return prisma.accountNote.findMany({
    where: { clientId },
    include: { author: { select: { name: true } } },
    orderBy: { occurredAt: "desc" },
  });
}
