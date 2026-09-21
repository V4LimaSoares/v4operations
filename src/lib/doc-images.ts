import { mkdir, writeFile, readFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

// Images copied out of imported documents live next to the other uploads (bind-mounted volume).
const DIR = path.join(process.cwd(), "uploads", "docs-images");
const EXT_MIME: Record<string, string> = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif", svg: "image/svg+xml" };

export function docImageMime(file: string): string {
  return EXT_MIME[file.split(".").pop()?.toLowerCase() ?? ""] ?? "application/octet-stream";
}

export async function saveDocImage(bytes: Buffer, contentType: string): Promise<string> {
  const ext = Object.entries(EXT_MIME).find(([, m]) => m === contentType.split(";")[0])?.[0] ?? "png";
  await mkdir(DIR, { recursive: true });
  const file = `${crypto.randomUUID()}.${ext}`;
  await writeFile(path.join(DIR, file), bytes);
  return file;
}

export async function readDocImage(file: string): Promise<Buffer> {
  if (!/^[\w-]+\.\w+$/.test(file)) throw new Error("invalid file name");
  return readFile(path.join(DIR, file));
}
