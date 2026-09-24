import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStaffModule } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/audit";

const schema = z.object({
  category: z.enum(["SABER", "TER", "EXECUTAR", "DESTRAVA_RECEITA", "POTENCIALIZAR"]),
  service: z.string().min(1),
  variation: z.string().nullish(),
  valueBrl: z.number().min(0).nullish(),
  description: z.string().nullish(),
  status: z.enum(["Ativo", "Inativo"]).optional(),
  notes: z.string().nullish(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireStaffModule("portfolio");
  const { id } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  }
  const d = parsed.data;

  const item = await prisma.portfolioItem.update({
    where: { id },
    data: {
      category: d.category,
      service: d.service,
      variation: d.variation || null,
      valueBrl: d.valueBrl ?? null,
      description: d.description || null,
      status: d.status ?? "Ativo",
      notes: d.notes || null,
      updatedByName: actor.name,
    },
  });

  await logActivity({
    actorId: actor.id,
    actorName: actor.name,
    action: "editou",
    entityType: "Portfólio",
    entityId: item.id,
    entityLabel: item.service,
  });

  return NextResponse.json({ ok: true, item });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireStaffModule("portfolio");
  const { id } = await params;

  const item = await prisma.portfolioItem.delete({ where: { id } });

  await logActivity({
    actorId: actor.id,
    actorName: actor.name,
    action: "excluiu",
    entityType: "Portfólio",
    entityId: id,
    entityLabel: item.service,
  });

  return NextResponse.json({ ok: true });
}
