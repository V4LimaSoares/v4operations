import { NextResponse } from "next/server";
import { requireStaffModule } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/audit";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireStaffModule("financeiro");
  const { id } = await params;
  const tax = await prisma.taxPayment.delete({ where: { id } });

  await logActivity({
    actorId: actor.id,
    actorName: actor.name,
    action: "excluiu",
    entityType: "Imposto pago",
    entityId: tax.id,
    entityLabel: tax.name,
  });

  return NextResponse.json({ ok: true });
}
