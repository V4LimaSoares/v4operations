import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { isModuleKey } from "@/lib/permissions";
import { logActivity } from "@/lib/audit";

const schema = z.object({
  name: z.string().min(2).optional(),
  role: z.enum(["ADMIN", "STAFF"]).optional(),
  active: z.boolean().optional(),
  password: z.string().min(8).optional(),
  permissionProfileId: z.string().nullish(),
  modulePermissions: z.array(z.string()).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target || target.role === "CLIENT") {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
  }
  if (target.id === admin.id && (parsed.data.active === false || parsed.data.role === "STAFF")) {
    return NextResponse.json({ error: "Você não pode remover seu próprio acesso de administrador." }, { status: 400 });
  }

  const { password, modulePermissions, permissionProfileId, role, ...rest } = parsed.data;
  const effectiveRole = role ?? target.role;
  const cleanModules = modulePermissions?.filter(isModuleKey);

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...rest,
      ...(role && { role }),
      ...(password && { passwordHash: await hashPassword(password) }),
      ...(cleanModules !== undefined && { modulePermissions: effectiveRole === "ADMIN" ? [] : cleanModules }),
      ...(permissionProfileId !== undefined && {
        permissionProfileId: effectiveRole === "STAFF" ? permissionProfileId : null,
      }),
      // Revoke any existing sessions when access itself changes, so the new rules apply
      // immediately instead of waiting for the JWT's coarse snapshot to expire/refresh.
      ...((role || parsed.data.active === false || cleanModules !== undefined) && {
        sessionVersion: { increment: 1 },
      }),
    },
    // Never return the bcrypt hash to the client (see the same note in POST /api/admin/users).
    omit: { passwordHash: true },
  });

  await logActivity({
    actorId: admin.id,
    actorName: admin.name,
    action: "editou",
    entityType: "Usuário",
    entityId: user.id,
    entityLabel: user.name,
    detail: password ? "Senha redefinida" : undefined,
  });

  return NextResponse.json({ ok: true, user });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  if (id === admin.id) {
    return NextResponse.json({ error: "Você não pode excluir a própria conta." }, { status: 400 });
  }
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target || target.role === "CLIENT") {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
  }
  await prisma.user.delete({ where: { id } });

  await logActivity({
    actorId: admin.id,
    actorName: admin.name,
    action: "excluiu",
    entityType: "Usuário",
    entityId: target.id,
    entityLabel: target.name,
  });

  return NextResponse.json({ ok: true });
}
