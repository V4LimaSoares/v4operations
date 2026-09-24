import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { requireStaffModule } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/audit";

const schema = z.object({
  name: z.string().min(2).optional(),
  role: z.string().min(1).optional(),
  colorVar: z.string().min(1).optional(),
  active: z.boolean().optional(),
  // Attaches this profile to an Administração account that has none yet — used both by the
  // legacy-linking picker in "Novo usuário" and, in principle, any future re-link flow. Never
  // used to move a profile between accounts (rejected below if it already has one).
  userId: z.string().min(1).optional(),
  // Personal info — all optional, null clears the field.
  birthDate: z.string().nullish(),
  hireDate: z.string().nullish(),
  address: z.string().nullish(),
  email: z.string().email().nullish().or(z.literal("")),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireStaffModule("equipes");
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  }
  const existing = await prisma.teamMember.findUnique({ where: { id }, select: { userId: true } });
  if (!existing) {
    return NextResponse.json({ error: "Pessoa não encontrada." }, { status: 404 });
  }

  const data: Record<string, unknown> = { ...parsed.data };
  if ("birthDate" in parsed.data) data.birthDate = parsed.data.birthDate ? new Date(parsed.data.birthDate) : null;
  if ("hireDate" in parsed.data) data.hireDate = parsed.data.hireDate ? new Date(parsed.data.hireDate) : null;
  if ("email" in parsed.data) data.email = parsed.data.email || null;
  const isLinking = Boolean(parsed.data.userId);

  if (parsed.data.userId) {
    if (existing.userId) {
      return NextResponse.json({ error: "Este perfil já está vinculado a uma conta." }, { status: 409 });
    }
    const user = await prisma.user.findUnique({ where: { id: parsed.data.userId } });
    if (!user || (user.role !== "ADMIN" && user.role !== "STAFF")) {
      return NextResponse.json({ error: "Usuário inválido." }, { status: 400 });
    }
    const alreadyLinked = await prisma.teamMember.findUnique({ where: { userId: user.id } });
    if (alreadyLinked) {
      return NextResponse.json({ error: "Este usuário já está vinculado a outro perfil de equipe." }, { status: 409 });
    }
    // Mirror the account's name at link time — from here on name is Administração's field.
    data.name = user.name;
  } else if (existing.userId) {
    // Already linked from a previous request — name is Administração's field, never let it
    // drift back to something typed here (Prisma omits `undefined` keys from the update).
    data.name = undefined;
  }

  let member;
  try {
    member = await prisma.teamMember.update({ where: { id }, data });
  } catch (err) {
    // Two concurrent requests can both pass the `alreadyLinked` check above and race to link the
    // same userId — the DB's unique constraint on TeamMember.userId is the real guard; this just
    // turns that into a friendly 409 instead of a raw 500.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json(
        { error: "Este usuário já foi vinculado a outra pessoa da equipe. Atualize a página e tente novamente." },
        { status: 409 }
      );
    }
    throw err;
  }

  await logActivity({
    actorId: actor.id,
    actorName: actor.name,
    action: isLinking ? "vinculou" : "editou",
    entityType: "Membro da equipe",
    entityId: member.id,
    entityLabel: member.name,
  });

  return NextResponse.json({ ok: true, member });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireStaffModule("equipes");
  const { id } = await params;
  const member = await prisma.teamMember.delete({ where: { id } });

  await logActivity({
    actorId: actor.id,
    actorName: actor.name,
    action: "excluiu",
    entityType: "Membro da equipe",
    entityId: member.id,
    entityLabel: member.name,
  });

  return NextResponse.json({ ok: true });
}
