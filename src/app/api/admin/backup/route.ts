import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { logActivity } from "@/lib/audit";
import { buildBackup } from "@/lib/backup";

// Baixa um backup completo dos dados (somente administrador). Não é commitado em lugar nenhum:
// contém dados pessoais de clientes e da equipe (LGPD), então a cópia fica com quem baixou.
export async function GET(req: Request) {
  const admin = await requireAdmin();
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
