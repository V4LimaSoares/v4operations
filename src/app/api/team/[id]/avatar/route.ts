import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { readAvatarFile } from "@/lib/avatar-storage";

const EXT_MIME: Record<string, string> = { png: "image/png", jpg: "image/jpeg", webp: "image/webp" };

// Any logged-in user can view an avatar (it's rendered across Equipes/Squad/Clientes/SLA for
// everyone with access to those pages) — gated by session only, not by the "equipes" module.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;

  const member = await prisma.teamMember.findUnique({
    where: { id },
    select: { photoUrl: true, photo: { select: { data: true, mime: true } } },
  });
  if (!member?.photoUrl) {
    return NextResponse.json({ error: "Sem foto." }, { status: 404 });
  }

  let data: Uint8Array | null = member.photo ? new Uint8Array(member.photo.data) : null;
  let mime = member.photo?.mime ?? "application/octet-stream";

  if (!data) {
    // Legacy photo still stored as a file — serve it and migrate it into the database so it
    // survives the next redeploy.
    const bytes = await readAvatarFile(member.photoUrl).catch(() => null);
    if (!bytes) return NextResponse.json({ error: "Arquivo não encontrado." }, { status: 404 });
    mime = EXT_MIME[member.photoUrl.split(".").pop() ?? ""] ?? mime;
    data = new Uint8Array(bytes);
    await prisma.teamMemberPhoto
      .upsert({
        where: { teamMemberId: id },
        create: { teamMemberId: id, data: Buffer.from(bytes), mime },
        update: { data: Buffer.from(bytes), mime },
      })
      .catch(() => {});
  }

  return new NextResponse(data as BodyInit, {
    headers: { "Content-Type": mime, "Cache-Control": "private, max-age=3600" },
  });
}
