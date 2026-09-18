import { NextResponse } from "next/server";
import { z } from "zod";
import { requireModule } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/audit";

const schema = z.object({
  clientId: z.string().min(1),
  date: z.string().min(1),
  amountBrl: z.number().positive(),
  notes: z.string().optional(),
});

export async function POST(req: Request) {
  const user = await requireModule("faturamento");
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const { clientId, date, amountBrl, notes } = parsed.data;

  if (user.role === "CLIENT" && user.clientId !== clientId) {
    return NextResponse.json({ error: "Não autorizado para este cliente." }, { status: 403 });
  }

  const entry = await prisma.revenueEntry.create({
    data: { clientId, date: new Date(date), amountBrl, notes, source: "MANUAL" },
  });

  await logActivity({
    actorId: user.id,
    actorName: user.name,
    action: "criou",
    entityType: "Faturamento",
    entityId: entry.id,
    entityLabel: `R$ ${amountBrl.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} em ${date}`,
  });

  return NextResponse.json({ ok: true, entry });
}

export async function DELETE(req: Request) {
  const user = await requireModule("faturamento");
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id obrigatório." }, { status: 400 });

  const entry = await prisma.revenueEntry.findUnique({ where: { id } });
  if (!entry) return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
  if (user.role === "CLIENT" && user.clientId !== entry.clientId) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  await prisma.revenueEntry.delete({ where: { id } });

  await logActivity({
    actorId: user.id,
    actorName: user.name,
    action: "excluiu",
    entityType: "Faturamento",
    entityId: entry.id,
    entityLabel: `R$ ${Number(entry.amountBrl).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
  });

  return NextResponse.json({ ok: true });
}
