import { NextResponse } from "next/server";
import { requireStaffModule } from "@/lib/session";
import { getMaterialById } from "@/lib/data/materials";
import { readMaterialFile } from "@/lib/materials-storage";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireStaffModule("materiais");
  const { id } = await params;

  const material = await getMaterialById(id);
  if (!material) {
    return NextResponse.json({ error: "Material não encontrado." }, { status: 404 });
  }
  if (!material.filePath || !material.mimeType || !material.fileName) {
    return NextResponse.json({ error: "Este material é um link, não um arquivo." }, { status: 400 });
  }

  const bytes = await readMaterialFile(material.filePath).catch(() => null);
  if (!bytes) {
    return NextResponse.json({ error: "Arquivo não encontrado no armazenamento." }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": material.mimeType,
      "Content-Disposition": `attachment; filename="${encodeURIComponent(material.fileName)}"`,
      "Content-Length": String(bytes.length),
    },
  });
}
