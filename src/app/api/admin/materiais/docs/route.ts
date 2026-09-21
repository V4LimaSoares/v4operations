import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/audit";

const schema = z.object({
  parentId: z.string().nullish(),
  title: z.string().min(1).max(200),
  icon: z.string().max(8).nullish(),
  contentMd: z.string().optional(),
});

export async function POST(req: Request) {
  const actor = await requireAdmin();
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Título obrigatório." }, { status: 400 });
  }
  const { parentId, title, icon, contentMd } = parsed.data;

  const last = await prisma.materialDoc.findFirst({
    where: { parentId: parentId ?? null },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  const doc = await prisma.materialDoc.create({
    data: {
      parentId: parentId ?? null,
      title,
      icon: icon || null,
      contentMd: contentMd ?? "",
      position: (last?.position ?? -1) + 1,
      editedLocally: true,
      updatedByName: actor.name,
    },
  });

  await logActivity({ actorId: actor.id, actorName: actor.name, action: "criou", entityType: "Documento", entityId: doc.id, entityLabel: doc.title });
  return NextResponse.json({ ok: true, doc });
}
