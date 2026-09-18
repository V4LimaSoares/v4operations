import "server-only";
import { mkdir, writeFile, unlink, readFile } from "fs/promises";
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
  await mkdir(UPLOAD_DIR, { recursive: true });
  const ext = ALLOWED_MIME_TYPES[file.type] ?? "bin";
  const filePath = `${crypto.randomUUID()}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, filePath), bytes);
  return { filePath };
}

export async function readMaterialFile(filePath: string): Promise<Buffer> {
  return readFile(path.join(UPLOAD_DIR, filePath));
}

export async function deleteMaterialFile(filePath: string): Promise<void> {
  await unlink(path.join(UPLOAD_DIR, filePath)).catch(() => {});
}
