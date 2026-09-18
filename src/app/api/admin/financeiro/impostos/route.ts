import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStaffModule } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/audit";

const schema = z.object({
  name: z.string().min(1),
  amountBrl: z.number().positive(),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020),
  paidAt: z.string().nullish(),
  notes: z.string().nullish(),
});

export async function POST(req: Request) {
  const actor = await requireStaffModule("financeiro");
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  }

  const tax = await prisma.taxPayment.create({
    data: {
      name: parsed.data.name,
      amountBrl: parsed.data.amountBrl,
      month: parsed.data.month,
      year: parsed.data.year,
      paidAt: parsed.data.paidAt ? new Date(parsed.data.paidAt) : new Date(),
      notes: parsed.data.notes || null,
    },
  });

  await logActivity({
    actorId: actor.id,
    actorName: actor.name,
    action: "criou",
    entityType: "Imposto pago",
    entityId: tax.id,
    entityLabel: tax.name,
  });

  return NextResponse.json({ ok: true, tax });
}
