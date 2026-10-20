/**
 * Traz os dados de PRODUÇÃO para o banco LOCAL, em um comando:
 *
 *   npm run pull-prod
 *
 * Precisa de BACKUP_SECRET (o mesmo valor definido no EasyPanel, 24+ caracteres) no seu .env local.
 * Opcional: PROD_URL (padrão https://operations.v4connect.app.br).
 *
 * É uma CÓPIA de produção para cá — só leitura em produção. O banco local é apagado e substituído
 * (restore-backup.ts recusa qualquer banco que não seja localhost). O que você editar localmente
 * depois NÃO volta para produção; para editar "uma coisa só", edite em produção e rode de novo.
 */
import { writeFileSync, mkdtempSync, readFileSync, existsSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { spawnSync } from "child_process";

// tsx não carrega o .env sozinho: lê BACKUP_SECRET/PROD_URL de lá quando não estiverem no ambiente.
if (existsSync(".env")) {
  for (const line of readFileSync(".env", "utf8").split("\n")) {
    const m = line.match(/^\s*(BACKUP_SECRET|PROD_URL)\s*=\s*"?([^"\n]*)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const base = (process.env.PROD_URL ?? "https://operations.v4connect.app.br").replace(/\/$/, "");
const secret = process.env.BACKUP_SECRET;
if (!secret || secret.length < 24) {
  console.error("Defina BACKUP_SECRET (24+ caracteres) no .env local e no EasyPanel (mesmo valor).");
  process.exit(1);
}

async function main() {
  console.log(`Baixando backup de ${base} …`);
  const res = await fetch(`${base}/api/admin/backup?files=1`, { headers: { Authorization: `Bearer ${secret}` } });
  if (!res.ok) {
    console.error(`Falha (${res.status}). Confira se o BACKUP_SECRET é o mesmo no EasyPanel e se o commit com o backup foi implantado.`);
    process.exit(1);
  }
  const file = join(mkdtempSync(join(tmpdir(), "v4-pull-")), "backup.json.gz");
  writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  console.log("Restaurando no banco local …");
  const r = spawnSync("npx", ["tsx", "scripts/restore-backup.ts", file, "--yes"], { stdio: "inherit" });
  process.exit(r.status ?? 1);
}
main();
