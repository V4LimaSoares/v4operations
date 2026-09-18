import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStaffModule } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/audit";

const schema = z.object({
  kind: z.enum(["BILL", "PROLABORE"]),
  name: z.string().min(1),
  category: z.string().nullish(),
  amountBrl: z.number().positive(),
  dayOfMonth: z.number().int().min(1).max(28),
  teamMemberId: z.string().nullish(),
  active: z.boolean().optional(),
  percentage: z.number().min(0).max(100).nullish(),
  referralPercentage: z.number().min(0).max(100).nullish(),
  hireDate: z.string().nullish(),
  terminationDate: z.string().nullish(),
  isPartner: z.boolean().optional(),
});

export async function POST(req: Request) {
  const actor = await requireStaffModule("financeiro");
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  }
  const d = parsed.data;

  const expense = await prisma.recurringExpense.create({
    data: {
      kind: d.kind,
      name: d.name,
      category: d.kind === "BILL" ? d.category ?? null : null,
      amountBrl: d.amountBrl,
      dayOfMonth: d.dayOfMonth,
      active: d.active ?? true,
      teamMemberId: d.kind === "PROLABORE" ? d.teamMemberId ?? null : null,
      percentage: d.kind === "PROLABORE" ? d.percentage ?? null : null,
      referralPercentage: d.kind === "PROLABORE" ? d.referralPercentage ?? null : null,
      hireDate: d.kind === "PROLABORE" && d.hireDate ? new Date(d.hireDate) : null,
      terminationDate: d.kind === "PROLABORE" && d.terminationDate ? new Date(d.terminationDate) : null,
      isPartner: d.kind === "PROLABORE" ? d.isPartner ?? false : false,
    },
  });

  await logActivity({
    actorId: actor.id,
    actorName: actor.name,
    action: "criou",
    entityType: d.kind === "BILL" ? "Conta recorrente" : "Fixo/Pró-labore",
    entityId: expense.id,
    entityLabel: expense.name,
  });

  return NextResponse.json({ ok: true, expense });
}
