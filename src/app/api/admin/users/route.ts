import { NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { isModuleKey } from "@/lib/permissions";
import { logActivity } from "@/lib/audit";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(["ADMIN", "STAFF"]),
  password: z.string().min(8).optional(),
  permissionProfileId: z.string().nullish(),
  modulePermissions: z.array(z.string()).default([]),
});

function generatePassword() {
  return crypto.randomBytes(9).toString("base64url");
}

export async function POST(req: Request) {
  // Deliberately requireAdmin (not requireStaffModule): granting access is not itself a
  // delegable module — only the true admin manages who can do what, by default.
  const actor = await requireAdmin();
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  }
  const { name, email, role, password, permissionProfileId, modulePermissions } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return NextResponse.json({ error: "Já existe um usuário com este e-mail." }, { status: 409 });
  }

  const cleanModules = modulePermissions.filter(isModuleKey);
  const generatedPassword = password ?? generatePassword();
  const passwordHash = await hashPassword(generatedPassword);

  const user = await prisma.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      passwordHash,
      role,
      // ADMIN is unrestricted regardless of what's stored here — kept empty for clarity.
      modulePermissions: role === "ADMIN" ? [] : cleanModules,
      permissionProfileId: role === "STAFF" ? (permissionProfileId ?? null) : null,
    },
    // Never return the bcrypt hash to the client — it has no legitimate use there and would
    // otherwise sit in plain sight in the browser's network log for anyone with devtools access.
    omit: { passwordHash: true },
  });

  await logActivity({
    actorId: actor.id,
    actorName: actor.name,
    action: "criou",
    entityType: "Usuário",
    entityId: user.id,
    entityLabel: user.name,
  });

  return NextResponse.json({
    ok: true,
    user,
    generatedPassword: password ? undefined : generatedPassword,
  });
}
