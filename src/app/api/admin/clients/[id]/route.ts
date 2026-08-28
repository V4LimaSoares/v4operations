import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().min(2).optional(),
  company: z.string().min(2).optional(),
  status: z.enum(["ACTIVE", "PAUSED", "INACTIVE"]).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const client = await prisma.client.update({ where: { id }, data: parsed.data });

  if (parsed.data.status) {
    await prisma.user.updateMany({
      where: { clientId: id },
      data: { active: parsed.data.status !== "INACTIVE" },
    });
  }

  return NextResponse.json({ ok: true, client });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  await prisma.client.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
