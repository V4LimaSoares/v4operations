import "server-only";
import { prisma } from "@/lib/prisma";

export function listRootDocs() {
  return prisma.materialDoc.findMany({
    where: { parentId: null },
    orderBy: [{ position: "asc" }, { title: "asc" }],
    select: { id: true, title: true, icon: true, props: true, _count: { select: { children: true } } },
  });
}

export function getDocById(id: string) {
  return prisma.materialDoc.findUnique({
    where: { id },
    include: {
      children: { orderBy: [{ position: "asc" }, { title: "asc" }], select: { id: true, title: true, icon: true } },
    },
  });
}

/** Walks up parentId to the root — docs are shallow enough that one query per level is fine. */
export async function getDocBreadcrumb(id: string): Promise<{ id: string; title: string }[]> {
  const trail: { id: string; title: string }[] = [];
  let currentId: string | null = id;
  for (let i = 0; i < 20 && currentId; i++) {
    const doc: { id: string; title: string; parentId: string | null } | null = await prisma.materialDoc.findUnique({
      where: { id: currentId },
      select: { id: true, title: true, parentId: true },
    });
    if (!doc) break;
    trail.unshift({ id: doc.id, title: doc.title });
    currentId = doc.parentId;
  }
  return trail;
}

export function searchDocs(q: string) {
  return prisma.materialDoc.findMany({
    where: { OR: [{ title: { contains: q, mode: "insensitive" } }, { contentMd: { contains: q, mode: "insensitive" } }] },
    orderBy: { title: "asc" },
    take: 40,
    select: { id: true, title: true, icon: true },
  });
}
