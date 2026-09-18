import { NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "E-mail inválido." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });

  // Always respond generically to avoid leaking which emails exist.
  const genericResponse = {
    ok: true,
    message: "Se o e-mail existir em nossa base, um link de redefinição foi gerado.",
  };

  if (!user || !user.active) {
    return NextResponse.json(genericResponse);
  }

  const token = crypto.randomBytes(32).toString("hex");
  await prisma.passwordResetToken.create({
    data: {
      token,
      userId: user.id,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1h
    },
  });

  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin}/redefinir-senha?token=${token}`;

  // No transactional email provider is configured yet (see RESEND_API_KEY in .env.example).
  // Until one is wired up, the link is only logged server-side — NEVER echoed back in the
  // response outside local development. Doing so in production (which this app had been
  // running as, unconfigured, with RESEND_API_KEY unset) handed any unauthenticated caller a
  // live password-reset token for any account they named, including the admin's — full account
  // takeover with nothing but the target's email address. `NODE_ENV` is the gate, not the
  // presence of RESEND_API_KEY, so a misconfigured prod deploy can't reopen this.
  console.info(`[reset-password] Link de redefinição para ${user.email}: ${resetUrl}`);

  return NextResponse.json({
    ...genericResponse,
    devResetUrl: process.env.NODE_ENV === "production" ? undefined : resetUrl,
  });
}
