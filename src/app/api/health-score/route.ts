import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { requireStaffModule } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/audit";

const schema = z.object({
  clientName: z.string().min(1),
  clientId: z.string().nullish(),
  phase: z.string().min(1).default("ONGOING"),
  productCategory: z.string().nullish(),
  product: z.string().nullish(),
  feeBrl: z.number().nullish(),
  projectStart: z.string().nullish(),
  leadTimeMonths: z.number().int().nullish(),
  replanDate: z.string().nullish(),
  lastUpdate: z.string().nullish(),
  contributionMarginPct: z.number().nullish(),
  roi: z.number().nullish(),
  revenueGoalBrl: z.number().nullish(),
  revenueAchievedBrl: z.number().nullish(),
  investmentGoalBrl: z.number().nullish(),
  investmentAchievedBrl: z.number().nullish(),
  planningLink: z.string().nullish(),
  kpiGoal: z.string().nullish(),
  kpiPartial: z.string().nullish(),
  kpiAchieved: z.boolean().nullish(),
  stakeholderRelationship: z.string().nullish(),
  flag: z.string().nullish(),
  hsUpToDate: z.string().nullish(),
  accountOwner: z.string().nullish(),
  nextCheckin: z.string().nullish(),
  checklist: z.record(z.string(), z.string()).nullish(),
  growth: z.string().nullish(),
  churnProbabilityPct: z.number().nullish(),
  fact: z.string().nullish(),
  cause: z.string().nullish(),
  action: z.string().nullish(),
  notes: z.string().nullish(),
  endDate: z.string().nullish(),
  contractLink: z.string().nullish(),
  analysisFrequency: z.string().nullish(),
  paidMediaInvestmentBrl: z.number().nullish(),
  driveLink: z.string().nullish(),
});

export async function POST(req: Request) {
  const actor = await requireStaffModule("clientes");
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  }
  if (parsed.data.clientId) {
    const client = await prisma.client.findUnique({ where: { id: parsed.data.clientId } });
    if (!client) return NextResponse.json({ error: "Cliente vinculado não encontrado." }, { status: 400 });
  }
  const { projectStart, replanDate, lastUpdate, nextCheckin, endDate, checklist, ...rest } = parsed.data;
  const entry = await prisma.healthScoreEntry.create({
    data: {
      ...rest,
      checklist: checklist ?? Prisma.JsonNull,
      projectStart: projectStart ? new Date(projectStart) : null,
      replanDate: replanDate ? new Date(replanDate) : null,
      lastUpdate: lastUpdate ? new Date(lastUpdate) : null,
      nextCheckin: nextCheckin ? new Date(nextCheckin) : null,
      endDate: endDate ? new Date(endDate) : null,
    },
  });

  await logActivity({
    actorId: actor.id,
    actorName: actor.name,
    action: "criou",
    entityType: "Health Score",
    entityId: entry.id,
    entityLabel: entry.clientName,
  });

  return NextResponse.json({ ok: true, entry });
}
