import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/audit";
import { runNotionImport, type ImportReport } from "@/lib/notion-import";

export const maxDuration = 300;

const schema = z.object({
  mode: z.enum(["dry-run", "import"]),
  only: z.string().max(100).optional(),
});

async function setStatus(data: { status: string; mode?: string; report?: ImportReport; message?: string | null }) {
  const row = await prisma.materialDocImport.findFirst();
  const payload = {
    status: data.status,
    ...(data.mode ? { mode: data.mode } : {}),
    ...(data.report ? { pages: data.report.pages, images: data.report.imagesSaved || data.report.imagesFound, reportJson: data.report as object } : {}),
    message: data.message ?? null,
  };
  if (row) await prisma.materialDocImport.update({ where: { id: row.id }, data: payload });
  else await prisma.materialDocImport.create({ data: payload });
}

export async function GET() {
  await requireAdmin();
  const row = await prisma.materialDocImport.findFirst();
  return NextResponse.json({ status: row?.status ?? "IDLE", mode: row?.mode, pages: row?.pages ?? 0, images: row?.images ?? 0, message: row?.message, report: row?.reportJson ?? null, updatedAt: row?.updatedAt });
}

export async function POST(req: Request) {
  const actor = await requireAdmin();
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  const { mode, only } = parsed.data;

  const current = await prisma.materialDocImport.findFirst();
  if (current?.status === "RUNNING" && Date.now() - current.updatedAt.getTime() < 10 * 60_000) {
    return NextResponse.json({ error: "Já existe uma importação em andamento." }, { status: 409 });
  }
  await setStatus({ status: "RUNNING", mode, message: null });

  // Fire-and-forget: the UI polls GET for progress.
  void (async () => {
    let last = 0;
    try {
      const report = await runNotionImport({
        mode,
        only,
        onProgress: async (r) => {
          if (Date.now() - last > 2000) {
            last = Date.now();
            await setStatus({ status: "RUNNING", report: r });
          }
        },
      });
      await setStatus({ status: "DONE", report });
      if (mode === "import") {
        await logActivity({ actorId: actor.id, actorName: actor.name, action: "criou", entityType: "Documento", entityId: "notion-import", entityLabel: "Importação do Catálogo de Serviços", detail: `${report.created} criados, ${report.updated} atualizados, ${report.skippedEdited} preservados (editados)` });
      }
    } catch (err) {
      await setStatus({ status: "ERROR", message: (err as Error).message });
    }
  })();

  return NextResponse.json({ started: true });
}
