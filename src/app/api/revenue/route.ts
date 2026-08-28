import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  clientId: z.string().min(1),
  date: z.string().min(1),
  amountBrl: z.number().positive(),
  notes: z.string().optional(),
});

export async function POST(req: Request) {
  const user = await requireUser();
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const { clientId, date, amountBrl, notes } = parsed.data;

  if (user.role !== "ADMIN" && user.clientId !== clientId) {
    return NextResponse.json({ error: "Não autorizado para este cliente." }, { status: 403 });
  }

  const entry = await prisma.revenueEntry.create({
    data: { clientId, date: new Date(date), amountBrl, notes, source: "MANUAL" },
  });

  return NextResponse.json({ ok: true, entry });
}

export async function DELETE(req: Request) {
  const user = await requireUser();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id obrigatório." }, { status: 400 });

  const entry = await prisma.revenueEntry.findUnique({ where: { id } });
  if (!entry) return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
  if (user.role !== "ADMIN" && user.clientId !== entry.clientId) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  await prisma.revenueEntry.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
