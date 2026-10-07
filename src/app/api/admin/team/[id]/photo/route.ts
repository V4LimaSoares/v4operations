import { NextResponse } from "next/server";
import { requireStaffModule } from "@/lib/session";
import { logActivity } from "@/lib/audit";
import { canEditOwnProfile, forbidden, MSG } from "@/lib/capabilities";
import { setMemberPhoto, clearMemberPhoto } from "@/lib/team-photo";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireStaffModule("equipes");
  const { id } = await params;
  if (!(await canEditOwnProfile(actor, id))) return forbidden(MSG.ownProfile);

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Selecione uma imagem." }, { status: 400 });

  const result = await setMemberPhoto(id, file);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.error.includes("encontrada") ? 404 : 400 });

  await logActivity({
    actorId: actor.id,
    actorName: actor.name,
    action: "editou",
    entityType: "Membro da equipe",
    entityId: id,
    entityLabel: "Foto de perfil",
    detail: "Foto de perfil atualizada",
  });

  return NextResponse.json({ ok: true, photoUrl: result.photoUrl });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireStaffModule("equipes");
  const { id } = await params;
  if (!(await canEditOwnProfile(actor, id))) return forbidden(MSG.ownProfile);

  if (!(await clearMemberPhoto(id))) {
    return NextResponse.json({ error: "Pessoa não encontrada." }, { status: 404 });
  }

  await logActivity({
    actorId: actor.id,
    actorName: actor.name,
    action: "editou",
    entityType: "Membro da equipe",
    entityId: id,
    entityLabel: "Foto de perfil",
    detail: "Foto de perfil removida",
  });

  return NextResponse.json({ ok: true });
}
