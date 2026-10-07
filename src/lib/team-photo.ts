import "server-only";
import { prisma } from "@/lib/prisma";
import { MAX_AVATAR_SIZE_BYTES, ALLOWED_AVATAR_MIME_TYPES, deleteAvatarFile } from "@/lib/avatar-storage";

/** Single source of truth for a person's photo, used by Equipes and Perfil alike. Bytes go in the
 *  database (TeamMemberPhoto) so they survive redeploys; TeamMember.photoUrl stays as the
 *  "has photo" marker + cache-buster (it changes on every upload). */
export async function setMemberPhoto(memberId: string, file: File): Promise<{ error: string } | { photoUrl: string }> {
  if (file.size === 0) return { error: "Selecione uma imagem." };
  if (file.size > MAX_AVATAR_SIZE_BYTES) return { error: "Imagem maior que 5MB." };
  if (!(file.type in ALLOWED_AVATAR_MIME_TYPES)) return { error: "Use PNG, JPG ou WebP." };

  const existing = await prisma.teamMember.findUnique({ where: { id: memberId }, select: { photoUrl: true } });
  if (!existing) return { error: "Pessoa não encontrada." };

  const data = Buffer.from(await file.arrayBuffer());
  await prisma.teamMemberPhoto.upsert({
    where: { teamMemberId: memberId },
    create: { teamMemberId: memberId, data, mime: file.type },
    update: { data, mime: file.type },
  });
  const photoUrl = `db-${Date.now()}`;
  await prisma.teamMember.update({ where: { id: memberId }, data: { photoUrl } });
  // Legacy file-based photo, if any, is no longer referenced.
  if (existing.photoUrl && !existing.photoUrl.startsWith("db-")) await deleteAvatarFile(existing.photoUrl);
  return { photoUrl };
}

export async function clearMemberPhoto(memberId: string) {
  const existing = await prisma.teamMember.findUnique({ where: { id: memberId }, select: { photoUrl: true } });
  if (!existing) return false;
  await prisma.teamMemberPhoto.deleteMany({ where: { teamMemberId: memberId } });
  if (existing.photoUrl && !existing.photoUrl.startsWith("db-")) await deleteAvatarFile(existing.photoUrl);
  await prisma.teamMember.update({ where: { id: memberId }, data: { photoUrl: null } });
  return true;
}
