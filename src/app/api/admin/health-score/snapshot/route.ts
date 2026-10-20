import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { getHealthConfig, loadSharedSignals, computeClientHealth } from "@/lib/data/health-signals";

// Grava o snapshot diário do Health Score calculado de todos os clientes ativos — é o que forma o
// histórico/evolução. Aceita um administrador logado OU o segredo HEALTH_SNAPSHOT_SECRET (para um
// agendador externo). Um snapshot por cliente por dia (upsert), então rodar duas vezes não duplica.
export async function POST(req: Request) {
  const secret = process.env.HEALTH_SNAPSHOT_SECRET;
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const user = await getCurrentUser();
  const authorized = (secret && bearer && bearer === secret) || user?.role === "ADMIN";
  if (!authorized) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const [config, shared, clients] = await Promise.all([
    getHealthConfig(),
    loadSharedSignals(),
    prisma.client.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, createdAt: true, slaGroupName: true, ekyteClientName: true },
    }),
  ]);

  // Histórico de SLA: o monitor só expõe o estado atual, então registramos o nível por cliente a
  // cada rodada (só se o monitor respondeu — sem resposta não gravamos "NONE" por engano).
  if (shared.monitor) {
    const levelOf = (group: string) => {
      const match = (m: { group: string }) => `V4 Company + ${m.group}` === group || m.group === group;
      return shared.monitor!.urgent.some(match) ? "URGENT" : shared.monitor!.attention.some(match) ? "ATTENTION" : "NONE";
    };
    const linked = clients.filter((c) => c.slaGroupName);
    if (linked.length > 0) {
      await prisma.slaSnapshot.createMany({ data: linked.map((c) => ({ clientId: c.id, level: levelOf(c.slaGroupName!) })) });
    }
  }

  const day = new Date(new Date().toISOString().slice(0, 10));
  const counts: Record<string, number> = {};
  for (const c of clients) {
    const r = await computeClientHealth(c, config, shared);
    counts[r.classification] = (counts[r.classification] ?? 0) + 1;
    const data = {
      score: r.score,
      classification: r.classification,
      partial: r.partial,
      dimensions: JSON.parse(JSON.stringify(r.dimensions)),
      configVersion: config.version,
    };
    await prisma.healthSnapshot.upsert({
      where: { clientId_day: { clientId: c.id, day } },
      create: { clientId: c.id, day, ...data },
      update: data,
    });
  }
  return NextResponse.json({ ok: true, clients: clients.length, counts, configVersion: config.version });
}
