import { NextResponse } from "next/server";
import { requireStaffModule } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/audit";
import { MATERIAL_CATEGORIES } from "@/lib/materials-constants";
import { saveMaterialFile, MAX_FILE_SIZE_BYTES, ALLOWED_MIME_TYPES } from "@/lib/materials-storage";

function isValidUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const actor = await requireStaffModule("materiais");
  const form = await req.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const title = String(form.get("title") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  const category = String(form.get("category") ?? "");
  const linkUrl = String(form.get("linkUrl") ?? "").trim();
  const file = form.get("file");
  const hasFile = file instanceof File && file.size > 0;

  if (!title || title.length < 2) {
    return NextResponse.json({ error: "Título obrigatório." }, { status: 400 });
  }
  if (!MATERIAL_CATEGORIES.includes(category as (typeof MATERIAL_CATEGORIES)[number])) {
    return NextResponse.json({ error: "Categoria inválida." }, { status: 400 });
  }
  if (!hasFile && !linkUrl) {
    return NextResponse.json({ error: "Selecione um arquivo ou informe um link." }, { status: 400 });
  }
  if (hasFile && linkUrl) {
    return NextResponse.json({ error: "Escolha um arquivo ou um link, não os dois." }, { status: 400 });
  }

  if (linkUrl) {
    if (!isValidUrl(linkUrl)) {
      return NextResponse.json({ error: "Link inválido — use um endereço http(s) completo." }, { status: 400 });
    }
    const material = await prisma.material.create({
      data: { title, description: description || null, category, linkUrl, uploadedById: actor.id, uploadedByName: actor.name },
    });
    await logActivity({
      actorId: actor.id,
      actorName: actor.name,
      action: "criou",
      entityType: "Material",
      entityId: material.id,
      entityLabel: material.title,
    });
    return NextResponse.json({ ok: true, material });
  }

  const uploadedFile = file as File;
  if (uploadedFile.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json({ error: "Arquivo maior que 25MB." }, { status: 400 });
  }
  if (!(uploadedFile.type in ALLOWED_MIME_TYPES)) {
    return NextResponse.json({ error: "Tipo de arquivo não permitido. Use PDF, PPT, DOC, XLS ou imagem." }, { status: 400 });
  }

  const { filePath } = await saveMaterialFile(uploadedFile);

  const material = await prisma.material.create({
    data: {
      title,
      description: description || null,
      category,
      fileName: uploadedFile.name,
      filePath,
      fileSizeBytes: uploadedFile.size,
      mimeType: uploadedFile.type,
      uploadedById: actor.id,
      uploadedByName: actor.name,
    },
  });

  await logActivity({
    actorId: actor.id,
    actorName: actor.name,
    action: "criou",
    entityType: "Material",
    entityId: material.id,
    entityLabel: material.title,
  });

  return NextResponse.json({ ok: true, material });
}
