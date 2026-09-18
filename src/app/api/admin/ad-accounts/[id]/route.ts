import { NextResponse } from "next/server";
import { requireStaffModule } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/audit";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireStaffModule("contas");
  const { id } = await params;
  const account = await prisma.adAccount.delete({ where: { id } });

  await logActivity({
    actorId: actor.id,
    actorName: actor.name,
    action: "excluiu",
    entityType: "Conta de anúncio",
    entityId: account.id,
    entityLabel: account.name,
  });

  return NextResponse.json({ ok: true });
}
