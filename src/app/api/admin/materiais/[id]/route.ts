import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/audit";
import { deleteMaterialFile } from "@/lib/materials-storage";
import { MATERIAL_CATEGORIES } from "@/lib/materials-constants";

const schema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().nullish(),
  category: z.enum(MATERIAL_CATEGORIES).optional(),
  linkUrl: z.string().url().nullish(),
});

// Editing (and deleting) a material is Administrador-only — everyone else with access to
// Materiais Operacionais can view/download/open the link, never change or remove it.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireAdmin();
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  }

  const existing = await prisma.material.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Material não encontrado." }, { status: 404 });
  }
  // linkUrl only makes sense for a material that's already a link — editing can't turn a file
  // into a link or vice versa, that's a re-upload, not an edit.
  if (parsed.data.linkUrl !== undefined && !existing.linkUrl) {
    return NextResponse.json({ error: "Este material é um arquivo, não um link." }, { status: 400 });
  }

  const material = await prisma.material.update({
    where: { id },
    data: {
      ...(parsed.data.title !== undefined && { title: parsed.data.title }),
      ...(parsed.data.description !== undefined && { description: parsed.data.description || null }),
      ...(parsed.data.category !== undefined && { category: parsed.data.category }),
      ...(parsed.data.linkUrl !== undefined && { linkUrl: parsed.data.linkUrl }),
    },
  });

  await logActivity({
    actorId: actor.id,
    actorName: actor.name,
    action: "editou",
    entityType: "Material",
    entityId: material.id,
    entityLabel: material.title,
  });

  return NextResponse.json({ ok: true, material });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireAdmin();
  const { id } = await params;

  const material = await prisma.material.delete({ where: { id } }).catch(() => null);
  if (!material) {
    return NextResponse.json({ error: "Material não encontrado." }, { status: 404 });
  }
  if (material.filePath) await deleteMaterialFile(material.filePath);

  await logActivity({
    actorId: actor.id,
    actorName: actor.name,
    action: "excluiu",
    entityType: "Material",
    entityId: material.id,
    entityLabel: material.title,
  });

  return NextResponse.json({ ok: true });
}
