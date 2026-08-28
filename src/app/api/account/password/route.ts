import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, setSessionCookie } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "A nova senha deve ter ao menos 8 caracteres."),
});

export async function POST(req: Request) {
  const user = await requireUser();
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  }

  const valid = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Senha atual incorreta." }, { status: 400 });
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, sessionVersion: { increment: 1 } },
  });

  // Re-issue the session so the user isn't logged out by the sessionVersion bump above
  // (that bump exists to revoke *other* sessions after a password change).
  await setSessionCookie({
    userId: updated.id,
    role: updated.role,
    clientId: updated.clientId,
    sessionVersion: updated.sessionVersion,
    name: updated.name,
    email: updated.email,
  });

  return NextResponse.json({ ok: true });
}
