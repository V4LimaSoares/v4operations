// `npm run build`: aplica as migrações e compila. Em modo espelho (DB_READONLY=1, banco de produção
// com usuário só de leitura) NÃO migra — não há permissão para isso e não deve haver.
import { execSync } from "node:child_process";

const run = (cmd) => execSync(cmd, { stdio: "inherit" });
if (process.env.DB_READONLY === "1") {
  console.log("[build] DB_READONLY=1: pulando prisma migrate deploy");
} else {
  run("npx prisma migrate deploy");
}
run("npx next build");
