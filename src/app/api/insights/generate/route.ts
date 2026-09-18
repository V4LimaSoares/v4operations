import { NextResponse } from "next/server";
import { requireModule } from "@/lib/session";
import { resolveScope } from "@/lib/scope";
import { generateInsightsForClient, generateInsightsForAllClients } from "@/lib/insights-engine";

export async function POST(req: Request) {
  const user = await requireModule("insights");
  const body = await req.json().catch(() => ({}));
  const scope = resolveScope(user, body.clientId);

  if (scope.clientId) {
    const result = await generateInsightsForClient(scope.clientId);
    return NextResponse.json(result);
  }

  if (user.role === "CLIENT") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const result = await generateInsightsForAllClients();
  return NextResponse.json(result);
}
