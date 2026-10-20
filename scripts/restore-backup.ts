/**
 * Restaura um backup (.json.gz baixado em Configurações → Backup) no banco LOCAL.
 *
 *   npx tsx scripts/restore-backup.ts caminho/do/backup.json.gz --yes
 *
 * ⚠ Apaga TODOS os dados do banco apontado por DATABASE_URL antes de importar. Por segurança só roda
 * se o banco for localhost/127.0.0.1 — nunca contra produção. Senhas não vêm no backup: todos os
 * usuários ficam com a senha padrão local (SEED_ADMIN_PASSWORD ou "Admin@12345").
 */
import { readFileSync } from "fs";
import { gunzipSync } from "zlib";
import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

const file = process.argv[2];
if (!file || !process.argv.includes("--yes")) {
  console.error("Uso: npx tsx scripts/restore-backup.ts <arquivo.json.gz> --yes");
  process.exit(1);
}
const url = process.env.DATABASE_URL ?? "";
if (!/@(localhost|127\.0\.0\.1)[:/]/.test(url)) {
  console.error("Recusado: DATABASE_URL não aponta para localhost. Este script só restaura em banco local.");
  process.exit(1);
}

function decode(v: unknown): unknown {
  if (v && typeof v === "object" && !Array.isArray(v)) {
    const o = v as Record<string, unknown>;
    if ("$date" in o) return new Date(o.$date as string);
    if ("$bytes" in o) return Buffer.from(o.$bytes as string, "base64");
    if ("$decimal" in o) return new Prisma.Decimal(o.$decimal as string);
    if ("$bigint" in o) return BigInt(o.$bigint as string);
  }
  return v;
}

async function main() {
  const prisma = new PrismaClient();
  const backup = JSON.parse(gunzipSync(readFileSync(file)).toString("utf8"));
  if (backup.format !== "v4-ops-backup") throw new Error("Arquivo não é um backup do V4 Operations.");
  const defaultHash = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD ?? "Admin@12345", 12);

  const models = Prisma.dmmf.datamodel.models.filter((m) => backup.tables[m.name]);
  const jsonFields = (name: string) =>
    new Set(Prisma.dmmf.datamodel.models.find((m) => m.name === name)!.fields.filter((f) => f.type === "Json").map((f) => f.name));

  await prisma.$transaction(
    async (tx) => {
      // FKs desligadas só nesta transação (precisa de superusuário local) — evita ordenar por dependência.
      await tx.$executeRawUnsafe("SET session_replication_role = replica");
      for (const m of models) await tx.$executeRawUnsafe(`TRUNCATE TABLE "${m.name}" CASCADE`);
      for (const m of models) {
        const rows = backup.tables[m.name] as Record<string, unknown>[];
        const jf = jsonFields(m.name);
        const data = rows.map((row) => {
          const out: Record<string, unknown> = {};
          for (const [k, v] of Object.entries(row)) out[k] = jf.has(k) ? v : decode(v);
          if (m.name === "User") out.passwordHash = defaultHash;
          return out;
        });
        const delegate = (tx as unknown as Record<string, { createMany: (a: { data: unknown[] }) => Promise<unknown> }>)[
          m.name.charAt(0).toLowerCase() + m.name.slice(1)
        ];
        for (let i = 0; i < data.length; i += 1000) await delegate.createMany({ data: data.slice(i, i + 1000) });
        console.log(`${m.name}: ${data.length}`);
      }
      await tx.$executeRawUnsafe("SET session_replication_role = DEFAULT");
    },
    { timeout: 10 * 60 * 1000 }
  );
  await prisma.$disconnect();
  console.log("Restauração concluída.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
