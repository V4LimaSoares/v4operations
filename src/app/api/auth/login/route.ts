import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth";
import { setSessionCookie } from "@/lib/session";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// After this many wrong passwords in a row, the account is locked for LOCKOUT_MINUTES — a plain,
// dependency-free brute-force guard. Per-account (not per-IP) so it can't be sidestepped by
// rotating source IPs, at the cost of being usable to lock a legitimate user out by an attacker
// who only knows their email; that trade-off is the standard one for this kind of control.
const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_MINUTES = 15;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

  if (!user || !user.active) {
    return NextResponse.json({ error: "E-mail ou senha incorretos." }, { status: 401 });
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return NextResponse.json(
      { error: "Muitas tentativas incorretas. Tente novamente em alguns minutos." },
      { status: 429 }
    );
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    const attempts = user.failedLoginAttempts + 1;
    const lockingOut = attempts >= LOCKOUT_THRESHOLD;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: lockingOut ? 0 : attempts,
        lockedUntil: lockingOut ? new Date(Date.now() + LOCKOUT_MINUTES * 60_000) : null,
      },
    });
    return NextResponse.json(
      lockingOut
        ? { error: "Muitas tentativas incorretas. Tente novamente em alguns minutos." }
        : { error: "E-mail ou senha incorretos." },
      { status: lockingOut ? 429 : 401 }
    );
  }

  await setSessionCookie({
    userId: user.id,
    role: user.role,
    clientId: user.clientId,
    sessionVersion: user.sessionVersion,
    name: user.name,
    email: user.email,
    modulePermissions: user.modulePermissions,
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date(), failedLoginAttempts: 0, lockedUntil: null },
  });

  return NextResponse.json({ ok: true, role: user.role });
}
