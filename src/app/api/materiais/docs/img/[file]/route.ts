import { NextResponse } from "next/server";
import { requireStaffModule } from "@/lib/session";
import { readDocImage, docImageMime } from "@/lib/doc-images";

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  await requireStaffModule("materiais");
  const { file } = await params;
  const bytes = await readDocImage(file).catch(() => null);
  if (!bytes) return NextResponse.json({ error: "Imagem não encontrada." }, { status: 404 });
  return new NextResponse(new Uint8Array(bytes), {
    headers: { "Content-Type": docImageMime(file), "Cache-Control": "private, max-age=86400" },
  });
}
