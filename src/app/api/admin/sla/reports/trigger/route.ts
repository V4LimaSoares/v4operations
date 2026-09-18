import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStaffModule } from "@/lib/session";
import { triggerSlaReport } from "@/lib/data/sla";

const schema = z.object({ type: z.enum(["weekly", "monthly", "daily"]) });

// Weekly/monthly re-run weekly_report.py --force-weekly/--force-monthly on the VPS — this posts a
// real approval-request message to the SLA TRIAGEM WhatsApp group, same as the scheduled
// Friday/month-end run. Daily just regenerates a transcript file, no send.
export async function POST(req: Request) {
  await requireStaffModule("controle_sla");
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Tipo inválido." }, { status: 400 });
  }
  const result = await triggerSlaReport(parsed.data.type);
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
