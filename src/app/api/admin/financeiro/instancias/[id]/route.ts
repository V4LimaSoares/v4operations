import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStaffModule } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/audit";

const schema = z.object({
  status: z.enum(["PENDING", "PAID"]).optional(),
  description: z.string().min(1).optional(),
  amountBrl: z.number().positive().optional(),
  dueDate: z.string().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireStaffModule("financeiro");
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  }
  const { status, dueDate, ...rest } = parsed.data;

  const instance = await prisma.expenseInstance.update({
    where: { id },
    data: {
      ...rest,
      ...(dueDate && { dueDate: new Date(dueDate) }),
      ...(status && { status, paidAt: status === "PAID" ? new Date() : null }),
    },
  });

  await logActivity({
    actorId: actor.id,
    actorName: actor.name,
    action: "editou",
    entityType: "Lançamento financeiro",
    entityId: instance.id,
    entityLabel: instance.description,
    detail: status ? (status === "PAID" ? "Marcado como pago" : "Marcado como pendente") : undefined,
  });

  return NextResponse.json({ ok: true, instance });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireStaffModule("financeiro");
  const { id } = await params;
  const instance = await prisma.expenseInstance.delete({ where: { id } });

  await logActivity({
    actorId: actor.id,
    actorName: actor.name,
    action: "excluiu",
    entityType: "Lançamento financeiro",
    entityId: instance.id,
    entityLabel: instance.description,
  });

  return NextResponse.json({ ok: true });
}
