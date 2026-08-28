import { NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

const schema = z.object({
  name: z.string().min(2),
  company: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8).optional(),
});

function generatePassword() {
  return crypto.randomBytes(9).toString("base64url");
}

export async function POST(req: Request) {
  await requireAdmin();
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  }

  const { name, company, email, password } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return NextResponse.json({ error: "Já existe um usuário com este e-mail." }, { status: 409 });
  }

  const generatedPassword = password ?? generatePassword();
  const passwordHash = await hashPassword(generatedPassword);

  const client = await prisma.client.create({
    data: {
      name,
      company,
      status: "ACTIVE",
      users: {
        create: { name, email: email.toLowerCase(), passwordHash, role: "CLIENT" },
      },
    },
    include: { users: true },
  });

  return NextResponse.json({
    ok: true,
    client,
    generatedPassword: password ? undefined : generatedPassword,
  });
}
