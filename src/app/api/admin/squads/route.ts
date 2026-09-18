import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStaffModule } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/audit";

const schema = z.object({ name: z.string().min(2), logoUrl: z.string().nullish() });

export async function POST(req: Request) {
  const actor = await requireStaffModule("equipes");
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Nome obrigatório." }, { status: 400 });
  }
  const squad = await prisma.squad.create({ data: { name: parsed.data.name, logoUrl: parsed.data.logoUrl ?? null } });

  await logActivity({
    actorId: actor.id,
    actorName: actor.name,
    action: "criou",
    entityType: "Squad",
    entityId: squad.id,
    entityLabel: squad.name,
  });

  return NextResponse.json({ ok: true, squad });
}
