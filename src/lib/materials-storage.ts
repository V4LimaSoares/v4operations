import "server-only";
import { unlink, readFile } from "fs/promises";
import { prisma } from "@/lib/prisma";
import path from "path";
import crypto from "crypto";

// Bind-mounted on the VPS (docker service --mount-add), sibling to the Postgres pgdata mount —
// never baked into the image, never present in the git repo. Falls back to a local ./uploads
// folder for dev, where it's gitignored.
const UPLOAD_DIR = process.env.MATERIALS_UPLOAD_DIR ?? path.join(process.cwd(), "uploads", "materiais");

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25MB

export const ALLOWED_MIME_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "image/png": "png",
  "image/jpeg": "jpg",
};

export async function saveMaterialFile(file: File): Promise<{ filePath: string }> {
  const ext = ALLOWED_MIME_TYPES[file.type] ?? "bin";
  const filePath = `${crypto.randomUUID()}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  // Banco de dados, não disco: o arquivo sobrevive a redeploys e entra nos backups.
  await prisma.storedFile.create({ data: { key: filePath, mime: file.type, data: bytes } });
  return { filePath };
}

export async function readMaterialFile(filePath: string): Promise<Buffer> {
  const stored = await prisma.storedFile.findUnique({ where: { key: filePath } });
  if (stored) return Buffer.from(stored.data);
  // Arquivo antigo, ainda só em disco: devolve e já migra para o banco para não se perder.
  const bytes = await readFile(path.join(UPLOAD_DIR, filePath));
  await prisma.storedFile.upsert({
    where: { key: filePath },
    create: { key: filePath, data: bytes },
    update: {},
  }).catch(() => {});
  return bytes;
}

export async function deleteMaterialFile(filePath: string): Promise<void> {
  await prisma.storedFile.deleteMany({ where: { key: filePath } });
  await unlink(path.join(UPLOAD_DIR, filePath)).catch(() => {});
}
