import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStaffModule } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/audit";

// A rotating palette for teammates added from the UI (the original 9 use named CSS vars already
// defined in globals.css for exact continuity with SLA/Ekyte charts — new hires just get a hex
// straight from this list, which `style={{ background: colorVar }}` accepts exactly like a var()).
const NEW_MEMBER_PALETTE = ["#0ea5e9", "#f97316", "#8b5cf6", "#14b8a6", "#f43f5e", "#84cc16", "#a855f7"];

const schema = z.object({
  name: z.string().min(2),
  role: z.string().min(1).default("Equipe"),
  colorVar: z.string().min(1).optional(),
  // Optional — links this new profile to an existing Administração account (must not already
  // have one). Equipes can create a person on its own now; linking is a choice, not a requirement.
  userId: z.string().min(1).nullish(),
});

export async function POST(req: Request) {
  const actor = await requireStaffModule("equipes");
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  }
  const { name, role, colorVar, userId } = parsed.data;

  let linkedUser: { id: string; name: string } | null = null;
  if (userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || (user.role !== "ADMIN" && user.role !== "STAFF")) {
      return NextResponse.json({ error: "Usuário inválido." }, { status: 400 });
    }
    const alreadyLinked = await prisma.teamMember.findUnique({ where: { userId } });
    if (alreadyLinked) {
      return NextResponse.json({ error: "Este usuário já está vinculado a outro perfil de equipe." }, { status: 409 });
    }
    linkedUser = user;
  }

  const count = await prisma.teamMember.count();
  const member = await prisma.teamMember.create({
    data: {
      name,
      role,
      colorVar: colorVar || NEW_MEMBER_PALETTE[count % NEW_MEMBER_PALETTE.length],
      userId: linkedUser?.id ?? null,
    },
  });

  await logActivity({
    actorId: actor.id,
    actorName: actor.name,
    action: "criou",
    entityType: "Membro da equipe",
    entityId: member.id,
    entityLabel: member.name,
    detail: linkedUser ? `Vinculado a ${linkedUser.name}` : undefined,
  });

  return NextResponse.json({ ok: true, member });
}
