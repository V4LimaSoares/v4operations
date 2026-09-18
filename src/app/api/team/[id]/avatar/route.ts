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

  const member = await prisma.teamMember.findUnique({ where: { id }, select: { photoUrl: true } });
  if (!member?.photoUrl) {
    return NextResponse.json({ error: "Sem foto." }, { status: 404 });
  }

  const bytes = await readAvatarFile(member.photoUrl).catch(() => null);
  if (!bytes) {
    return NextResponse.json({ error: "Arquivo não encontrado." }, { status: 404 });
  }

  const ext = member.photoUrl.split(".").pop() ?? "";
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": EXT_MIME[ext] ?? "application/octet-stream",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
