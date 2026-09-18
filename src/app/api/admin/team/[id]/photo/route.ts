import { NextResponse } from "next/server";
import { requireStaffModule } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/audit";
import { saveAvatarFile, deleteAvatarFile, MAX_AVATAR_SIZE_BYTES, ALLOWED_AVATAR_MIME_TYPES } from "@/lib/avatar-storage";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireStaffModule("equipes");
  const { id } = await params;

  const existing = await prisma.teamMember.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Pessoa não encontrada." }, { status: 404 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Selecione uma imagem." }, { status: 400 });
  }
  if (file.size > MAX_AVATAR_SIZE_BYTES) {
    return NextResponse.json({ error: "Imagem maior que 5MB." }, { status: 400 });
  }
  if (!(file.type in ALLOWED_AVATAR_MIME_TYPES)) {
    return NextResponse.json({ error: "Use PNG, JPG ou WebP." }, { status: 400 });
  }

  const { filePath } = await saveAvatarFile(file);
  if (existing.photoUrl) await deleteAvatarFile(existing.photoUrl);

  const member = await prisma.teamMember.update({ where: { id }, data: { photoUrl: filePath } });

  await logActivity({
    actorId: actor.id,
    actorName: actor.name,
    action: "editou",
    entityType: "Membro da equipe",
    entityId: member.id,
    entityLabel: member.name,
    detail: "Foto de perfil atualizada",
  });

  return NextResponse.json({ ok: true, photoUrl: member.photoUrl });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireStaffModule("equipes");
  const { id } = await params;

  const existing = await prisma.teamMember.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Pessoa não encontrada." }, { status: 404 });
  }
  if (existing.photoUrl) await deleteAvatarFile(existing.photoUrl);

  const member = await prisma.teamMember.update({ where: { id }, data: { photoUrl: null } });

  await logActivity({
    actorId: actor.id,
    actorName: actor.name,
    action: "editou",
    entityType: "Membro da equipe",
    entityId: member.id,
    entityLabel: member.name,
    detail: "Foto de perfil removida",
  });

  return NextResponse.json({ ok: true });
}
