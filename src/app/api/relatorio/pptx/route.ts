import { requireUser } from "@/lib/session";
import { resolveScope } from "@/lib/scope";
import { presetToRange } from "@/lib/data/metrics";
import { getReportData } from "@/lib/reports/data";
import { buildReportPptx } from "@/lib/reports/pptx";

export async function GET(req: Request) {
  const user = await requireUser();
  const { searchParams } = new URL(req.url);
  const scope = resolveScope(user, searchParams.get("clientId") ?? undefined);

  if (!scope.clientId) {
    return new Response("Selecione um cliente específico para gerar o relatório.", { status: 400 });
  }

  const range = presetToRange(searchParams.get("period") ?? "30d");
  const data = await getReportData(scope.clientId, range);
  if (!data) {
    return new Response("Cliente não encontrado.", { status: 404 });
  }

  const buffer = await buildReportPptx(data);
  const filename = `relatorio-${slugify(data.client.company)}.pptx`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
