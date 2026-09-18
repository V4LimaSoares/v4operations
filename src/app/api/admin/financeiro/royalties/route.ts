import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStaffModule } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/audit";

const schema = z.object({
  name: z.string().min(1),
  percentage: z.number().min(0).max(100),
  description: z.string().nullish(),
});

export async function POST(req: Request) {
  const actor = await requireStaffModule("financeiro");
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  }

  const royalty = await prisma.royaltyConfig.create({
    data: { name: parsed.data.name, percentage: parsed.data.percentage, description: parsed.data.description || null },
  });

  await logActivity({
    actorId: actor.id,
    actorName: actor.name,
    action: "criou",
    entityType: "Royalty",
    entityId: royalty.id,
    entityLabel: royalty.name,
  });

  return NextResponse.json({ ok: true, royalty });
}
