import "server-only";
import { prisma } from "@/lib/prisma";

export function listMaterials() {
  return prisma.material.findMany({ orderBy: { createdAt: "desc" } });
}

export function getMaterialById(id: string) {
  return prisma.material.findUnique({ where: { id } });
}
