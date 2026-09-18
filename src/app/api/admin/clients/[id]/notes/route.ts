import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStaffModule } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/audit";

const schema = z.object({
  type: z.enum(["Reunião", "Decisão", "Risco", "Observação"]),
  body: z.string().min(1),
  occurredAt: z.string().nullish(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireStaffModule("clientes");
  const { id: clientId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  }
  const note = await prisma.accountNote.create({
    data: {
      clientId,
      authorId: user.id,
      type: parsed.data.type,
      body: parsed.data.body,
      occurredAt: parsed.data.occurredAt ? new Date(parsed.data.occurredAt) : new Date(),
    },
  });

  const client = await prisma.client.findUnique({ where: { id: clientId }, select: { name: true } });
  await logActivity({
    actorId: user.id,
    actorName: user.name,
    action: "criou",
    entityType: "Nota",
    entityId: note.id,
    entityLabel: `${parsed.data.type} — ${client?.name ?? clientId}`,
  });

  return NextResponse.json({ ok: true, note });
}

export async function DELETE(req: Request) {
  const actor = await requireStaffModule("clientes");
  const { searchParams } = new URL(req.url);
  const noteId = searchParams.get("noteId");
  if (!noteId) {
    return NextResponse.json({ error: "noteId obrigatório." }, { status: 400 });
  }
  const note = await prisma.accountNote.delete({ where: { id: noteId } });

  await logActivity({
    actorId: actor.id,
    actorName: actor.name,
    action: "excluiu",
    entityType: "Nota",
    entityId: note.id,
    entityLabel: note.type,
  });

  return NextResponse.json({ ok: true });
}
