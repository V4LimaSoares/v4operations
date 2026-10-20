import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { logActivity } from "@/lib/audit";
import { buildBackup } from "@/lib/backup";

// Baixa um backup completo dos dados (somente administrador). Não é commitado em lugar nenhum:
// contém dados pessoais de clientes e da equipe (LGPD), então a cópia fica com quem baixou.
export async function GET(req: Request) {
  // Administrador logado OU o segredo BACKUP_SECRET (Bearer) — o segundo é o que permite ao
  // `npm run pull-prod` trazer os dados de produção para o Mac sem abrir o banco para a internet.
  const secret = process.env.BACKUP_SECRET;
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const viaSecret = !!secret && secret.length >= 24 && bearer === secret;
  const user = viaSecret ? null : await getCurrentUser();
  if (!viaSecret && user?.role !== "ADMIN") return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const admin = user ?? { id: null, name: "pull-prod (BACKUP_SECRET)" };
  const includeFiles = new URL(req.url).searchParams.get("files") === "1";
  const { buffer, counts } = await buildBackup({ includeFiles });

  await logActivity({
    actorId: admin.id,
    actorName: admin.name,
    action: "criou",
    entityType: "Backup",
    entityId: "download",
    entityLabel: "Backup dos dados",
    detail: `${Object.values(counts).reduce((a, b) => a + b, 0)} registros${includeFiles ? " (com arquivos)" : ""}`,
  });

  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/gzip",
      "Content-Disposition": `attachment; filename="v4-operations-backup-${stamp}.json.gz"`,
      "Cache-Control": "no-store",
    },
  });
}
