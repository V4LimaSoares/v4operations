import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { ownTeamMemberId } from "@/lib/capabilities";
import { setMemberPhoto, clearMemberPhoto } from "@/lib/team-photo";
import { logActivity } from "@/lib/audit";

// Perfil's photo and Equipes' photo are the same field (TeamMember.photoUrl + TeamMemberPhoto):
// changing it here changes it there and vice-versa. Needs only a login, not the "equipes" module,
// since it's strictly the caller's own profile.
export async function POST(req: Request) {
  const user = await requireUser();
  const memberId = await ownTeamMemberId(user);
  if (!memberId) {
    return NextResponse.json({ error: "Seu usuário ainda não está vinculado a um perfil em Equipes." }, { status: 404 });
  }
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Selecione uma imagem." }, { status: 400 });

  const result = await setMemberPhoto(memberId, file);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });

  await logActivity({
    actorId: user.id,
    actorName: user.name,
    action: "editou",
    entityType: "Membro da equipe",
    entityId: memberId,
    entityLabel: "Foto de perfil",
    detail: "Foto de perfil atualizada (Perfil)",
  });
  return NextResponse.json({ ok: true, photoUrl: result.photoUrl });
}

export async function DELETE() {
  const user = await requireUser();
  const memberId = await ownTeamMemberId(user);
  if (!memberId) return NextResponse.json({ error: "Perfil de equipe não encontrado." }, { status: 404 });
  await clearMemberPhoto(memberId);
  await logActivity({
    actorId: user.id,
    actorName: user.name,
    action: "editou",
    entityType: "Membro da equipe",
    entityId: memberId,
    entityLabel: "Foto de perfil",
    detail: "Foto de perfil removida (Perfil)",
  });
  return NextResponse.json({ ok: true });
}
