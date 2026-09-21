import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/audit";

const schema = z.object({
  title: z.string().min(1).max(200).optional(),
  icon: z.string().max(8).nullish(),
  contentMd: z.string().optional(),
  move: z.enum(["up", "down"]).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireAdmin();
  const { id } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }
  const { title, icon, contentMd, move } = parsed.data;

  const doc = await prisma.materialDoc.findUnique({ where: { id } });
  if (!doc) return NextResponse.json({ error: "Documento não encontrado." }, { status: 404 });

  if (move) {
    // Swap position with the neighbouring sibling (siblings are compared by position, then title).
    const siblings = await prisma.materialDoc.findMany({
      where: { parentId: doc.parentId },
      orderBy: [{ position: "asc" }, { title: "asc" }],
      select: { id: true },
    });
    const idx = siblings.findIndex((s) => s.id === id);
    const swapIdx = move === "up" ? idx - 1 : idx + 1;
    if (idx < 0 || swapIdx < 0 || swapIdx >= siblings.length) return NextResponse.json({ ok: true });
    const reordered = siblings.map((s) => s.id);
    [reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]];
    await prisma.$transaction(reordered.map((sid, position) => prisma.materialDoc.update({ where: { id: sid }, data: { position } })));
    return NextResponse.json({ ok: true });
  }

  const updated = await prisma.materialDoc.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(icon !== undefined && { icon: icon || null }),
      ...(contentMd !== undefined && { contentMd }),
      editedLocally: true,
      updatedByName: actor.name,
    },
  });

  await logActivity({ actorId: actor.id, actorName: actor.name, action: "editou", entityType: "Documento", entityId: updated.id, entityLabel: updated.title });
  return NextResponse.json({ ok: true, doc: updated });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireAdmin();
  const { id } = await params;
  const doc = await prisma.materialDoc.delete({ where: { id } }).catch(() => null);
  if (!doc) return NextResponse.json({ error: "Documento não encontrado." }, { status: 404 });

  await logActivity({ actorId: actor.id, actorName: actor.name, action: "excluiu", entityType: "Documento", entityId: doc.id, entityLabel: doc.title });
  return NextResponse.json({ ok: true, parentId: doc.parentId });
}
