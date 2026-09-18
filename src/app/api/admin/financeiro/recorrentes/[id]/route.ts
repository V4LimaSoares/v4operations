import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStaffModule } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/audit";

const schema = z.object({
  name: z.string().min(1).optional(),
  category: z.string().nullish(),
  amountBrl: z.number().positive().optional(),
  dayOfMonth: z.number().int().min(1).max(28).optional(),
  teamMemberId: z.string().nullish(),
  active: z.boolean().optional(),
  percentage: z.number().min(0).max(100).nullish(),
  referralPercentage: z.number().min(0).max(100).nullish(),
  hireDate: z.string().nullish(),
  terminationDate: z.string().nullish(),
  isPartner: z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireStaffModule("financeiro");
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  }
  const { hireDate, terminationDate, ...rest } = parsed.data;

  const expense = await prisma.recurringExpense.update({
    where: { id },
    data: {
      ...rest,
      ...(hireDate !== undefined && { hireDate: hireDate ? new Date(hireDate) : null }),
      ...(terminationDate !== undefined && { terminationDate: terminationDate ? new Date(terminationDate) : null }),
    },
  });

  await logActivity({
    actorId: actor.id,
    actorName: actor.name,
    action: "editou",
    entityType: expense.kind === "BILL" ? "Conta recorrente" : "Fixo/Pró-labore",
    entityId: expense.id,
    entityLabel: expense.name,
  });

  return NextResponse.json({ ok: true, expense });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireStaffModule("financeiro");
  const { id } = await params;
  const expense = await prisma.recurringExpense.delete({ where: { id } });

  await logActivity({
    actorId: actor.id,
    actorName: actor.name,
    action: "excluiu",
    entityType: expense.kind === "BILL" ? "Conta recorrente" : "Fixo/Pró-labore",
    entityId: expense.id,
    entityLabel: expense.name,
  });

  return NextResponse.json({ ok: true });
}
