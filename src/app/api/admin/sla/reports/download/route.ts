import { NextResponse } from "next/server";
import { requireStaffModule } from "@/lib/session";
import { getLatestSlaReportText, type SlaReportType } from "@/lib/data/sla";

const FILENAMES: Record<SlaReportType, string> = {
  weekly: "relatorio-semanal-sla.txt",
  monthly: "relatorio-mensal-sla.txt",
  daily: "overview-diario-sla.txt",
};

export async function GET(req: Request) {
  await requireStaffModule("controle_sla");
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  if (type !== "weekly" && type !== "monthly" && type !== "daily") {
    return NextResponse.json({ error: "Tipo inválido." }, { status: 400 });
  }
  const data = await getLatestSlaReportText(type);
  if (!data?.text) {
    return NextResponse.json({ error: "Nenhum relatório gerado ainda." }, { status: 404 });
  }
  return new NextResponse(data.text, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${FILENAMES[type]}"`,
    },
  });
}
