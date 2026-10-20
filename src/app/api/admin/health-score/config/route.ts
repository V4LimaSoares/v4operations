import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/audit";
import { getHealthConfig } from "@/lib/data/health-signals";

const schema = z.object({
  weights: z.object({
    performance: z.number().min(0).max(100),
    atendimento: z.number().min(0).max(100),
    operacao: z.number().min(0).max(100),
    relacionamento: z.number().min(0).max(100),
  }),
  healthyMin: z.number().int().min(1).max(100),
  attentionMin: z.number().int().min(0).max(99),
  newClientDays: z.number().int().min(0).max(365),
});

export async function GET() {
  await requireAdmin();
  return NextResponse.json(await getHealthConfig());
}

// Cada alteração cria uma NOVA versão (nunca edita a anterior): os snapshots guardam a versão
// usada, então mudar pesos não reescreve o histórico.
export async function POST(req: Request) {
  const admin = await requireAdmin();
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Parâmetros inválidos." }, { status: 400 });
  const { weights, healthyMin, attentionMin, newClientDays } = parsed.data;
  const sum = Object.values(weights).reduce((a, b) => a + b, 0);
  if (Math.round(sum) !== 100) return NextResponse.json({ error: "Os pesos precisam somar 100." }, { status: 400 });
  if (attentionMin >= healthyMin) return NextResponse.json({ error: "A faixa de Atenção deve ser menor que a de Saudável." }, { status: 400 });

  const current = await getHealthConfig();
  const row = await prisma.healthScoreConfig.create({
    data: { version: current.version + 1, weights, healthyMin, attentionMin, newClientDays, createdByName: admin.name },
  });
  await logActivity({
    actorId: admin.id,
    actorName: admin.name,
    action: "editou",
    entityType: "Health Score",
    entityId: row.id,
    entityLabel: "Parâmetros do Health Score",
    detail: `Nova versão ${row.version}: pesos ${JSON.stringify(weights)}, faixas ${healthyMin}/${attentionMin}`,
  });
  return NextResponse.json({ ok: true, version: row.version });
}
