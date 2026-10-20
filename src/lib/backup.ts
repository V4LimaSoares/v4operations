import "server-only";
import { gzipSync } from "zlib";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Backup lógico completo do banco, em JSON comprimido. Serve para (1) guardar uma cópia fora do
 * servidor e (2) trazer os dados de produção para o ambiente local (scripts/restore-backup.ts).
 *
 * Segredos NUNCA saem: hashes de senha viram "__RESET__", o token do eKyte vira "__REDACTED__" e os
 * tokens de redefinição de senha não são exportados. Arquivos enviados (StoredFile) só entram com
 * `includeFiles`, porque podem ser grandes.
 */
const SKIP_MODELS = new Set(["PasswordResetToken"]);
const FILE_MODELS = new Set(["StoredFile"]);

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

function encode(value: unknown): Json {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return { $date: value.toISOString() };
  if (Buffer.isBuffer(value) || value instanceof Uint8Array) return { $bytes: Buffer.from(value).toString("base64") };
  if (value instanceof Prisma.Decimal) return { $decimal: value.toString() };
  if (typeof value === "bigint") return { $bigint: value.toString() };
  if (Array.isArray(value)) return value.map(encode);
  if (typeof value === "object") return value as Json; // campos Json já são JSON puro
  return value as Json;
}

export async function buildBackup(opts: { includeFiles: boolean }) {
  const models = Prisma.dmmf.datamodel.models;
  const tables: Record<string, Json[]> = {};
  const counts: Record<string, number> = {};

  for (const model of models) {
    if (SKIP_MODELS.has(model.name)) continue;
    if (FILE_MODELS.has(model.name) && !opts.includeFiles) continue;
    const delegate = (prisma as unknown as Record<string, { findMany: () => Promise<Record<string, unknown>[]> }>)[
      model.name.charAt(0).toLowerCase() + model.name.slice(1)
    ];
    const rows = await delegate.findMany();
    tables[model.name] = rows.map((row) => {
      const out: Record<string, Json> = {};
      for (const [k, v] of Object.entries(row)) out[k] = encode(v);
      if (model.name === "User") out.passwordHash = "__RESET__";
      if (model.name === "EkyteIntegration") out.apiKey = "__REDACTED__";
      return out;
    });
    counts[model.name] = rows.length;
  }

  const payload = { format: "v4-ops-backup", version: 1, createdAt: new Date().toISOString(), includesFiles: opts.includeFiles, counts, tables };
  return { buffer: gzipSync(Buffer.from(JSON.stringify(payload))), counts };
}
