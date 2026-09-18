import "server-only";
import { mkdir, writeFile, unlink, readFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

// Same bind-mounted uploads root as Materiais (src/lib/materials-storage.ts), separate
// subfolder — never baked into the image, never present in the git repo.
const UPLOAD_ROOT = path.join(process.cwd(), "uploads", "avatars");

export const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export const ALLOWED_AVATAR_MIME_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export async function saveAvatarFile(file: File): Promise<{ filePath: string; mimeType: string }> {
  await mkdir(UPLOAD_ROOT, { recursive: true });
  const ext = ALLOWED_AVATAR_MIME_TYPES[file.type] ?? "bin";
  const filePath = `${crypto.randomUUID()}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_ROOT, filePath), bytes);
  return { filePath, mimeType: file.type };
}

export async function readAvatarFile(filePath: string): Promise<Buffer> {
  return readFile(path.join(UPLOAD_ROOT, filePath));
}

export async function deleteAvatarFile(filePath: string): Promise<void> {
  await unlink(path.join(UPLOAD_ROOT, filePath)).catch(() => {});
}
