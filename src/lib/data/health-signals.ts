import "server-only";
import { prisma } from "@/lib/prisma";
import { presetToRange, getSummaryWithComparison } from "@/lib/data/metrics";
import { getEkyteSnapshot, isEkyteOverdue } from "@/lib/data/ekyte";
import { getSlaMonitor, type MonitorData } from "@/lib/data/sla";
import {
  DEFAULT_CONFIG,
  computeHealth,
  scoreFromIndicators,
  type DimensionResult,
  type HealthConfig,
  type HealthResult,
  type Indicator,
} from "@/lib/health-score-engine";

/** Config vigente: a versão mais recente gravada, ou os padrões em código se ainda não houver. */
export async function getHealthConfig(): Promise<HealthConfig> {
  const row = await prisma.healthScoreConfig.findFirst({ orderBy: { version: "desc" } });
  if (!row) return DEFAULT_CONFIG;
  return {
    version: row.version,
    weights: row.weights as HealthConfig["weights"],
    healthyMin: row.healthyMin,
    attentionMin: row.attentionMin,
    newClientDays: row.newClientDays,
  };
}

type Shared = {
  ekyteTasks: Awaited<ReturnType<typeof getEkyteSnapshot>>["tasks"];
  monitor: MonitorData | null;
};

export async function loadSharedSignals(): Promise<Shared> {
  const [snap, monitor] = await Promise.all([getEkyteSnapshot(), getSlaMonitor()]);
  return { ekyteTasks: snap.tasks, monitor };
}

const pct = (n: number) => `${Math.round(n)}%`;

/** Reúne os dados reais do cliente e devolve o resultado calculado. Só usa o que existe de fato;
 *  o que não existe vira dimensão null (nunca 0 nem 100 por omissão). */
export async function computeClientHealth(
  client: { id: string; createdAt: Date; slaGroupName: string | null; ekyteClientName: string | null },
  config: HealthConfig,
  shared: Shared
): Promise<HealthResult> {
  const now = new Date();
  const range = presetToRange("30d");

  const [entries, notes, realAccounts, summary] = await Promise.all([
    prisma.healthScoreEntry.findMany({ where: { clientId: client.id } }),
    prisma.accountNote.findMany({
      where: { clientId: client.id, occurredAt: { gte: new Date(now.getTime() - 30 * 86400000) } },
      select: { type: true },
    }),
    prisma.adAccount.count({ where: { clientId: client.id, dataSource: "REAL" } }),
    getSummaryWithComparison({ clientId: client.id, isAggregate: false }, range, "all"),
  ]);
  const active = entries.filter((e) => e.phase.toLowerCase() !== "churn");

  // ---- Performance: só com conta REAL e dados no período ----
  const perf: Indicator[] = [];
  if (realAccounts > 0 && summary.current.hasData) {
    const g = active.find((e) => e.revenueGoalBrl && e.revenueGoalBrl > 0 && e.revenueAchievedBrl != null);
    if (g) {
      const attained = (g.revenueAchievedBrl! / g.revenueGoalBrl!) * 100;
      perf.push({
        label: "Meta de receita",
        value: pct(attained),
        points: Math.max(0, Math.min(100, attained)),
        source: "Health Score (meta × realizado)",
        problem: attained < 70 ? `receita em ${pct(attained)} da meta` : undefined,
        action: attained < 70 ? "Revisar plano de mídia frente à meta de receita" : undefined,
      });
    }
    const ig = active.find((e) => e.investmentGoalBrl && e.investmentGoalBrl > 0 && e.investmentAchievedBrl != null);
    if (ig) {
      const attained = (ig.investmentAchievedBrl! / ig.investmentGoalBrl!) * 100;
      // Ritmo de investimento: perto de 100% é ideal; muito abaixo ou acima perde pontos.
      const pts = Math.max(0, 100 - Math.abs(attained - 100));
      perf.push({
        label: "Ritmo de investimento",
        value: pct(attained),
        points: pts,
        source: "Health Score (meta × realizado)",
        problem: pts < 70 ? `investimento em ${pct(attained)} da meta` : undefined,
        action: pts < 70 ? "Ajustar verba para o ritmo planejado" : undefined,
      });
    }
    if (active.some((e) => e.kpiAchieved != null)) {
      const hit = active.filter((e) => e.kpiAchieved != null && e.kpiAchieved).length;
      const tot = active.filter((e) => e.kpiAchieved != null).length;
      perf.push({
        label: "KPI principal atingido",
        value: `${hit}/${tot}`,
        points: (hit / tot) * 100,
        source: "Health Score (KPI)",
        problem: hit < tot ? "KPI principal não atingido" : undefined,
        action: hit < tot ? "Definir plano de ação para o KPI fora da meta" : undefined,
      });
    }
    const prev = summary.previous;
    if (summary.current.conversionValueBrl > 0 && prev.conversionValueBrl > 0 && summary.current.costBrl > 0 && prev.costBrl > 0) {
      const ratio = summary.current.roasPlatform / prev.roasPlatform;
      perf.push({
        label: "ROAS de plataforma vs. período anterior",
        value: `${(ratio * 100 - 100).toFixed(0)}%`,
        points: Math.max(0, Math.min(100, 50 + (ratio - 1) * 100)),
        source: "Métricas das plataformas (30d)",
        problem: ratio < 0.85 ? "ROAS caiu em relação ao período anterior" : undefined,
        action: ratio < 0.85 ? "Auditar campanhas com queda de ROAS" : undefined,
      });
    }
  }

  // ---- Atendimento: só alertas atuais (sem histórico ainda) e só com grupo vinculado ----
  const att: Indicator[] = [];
  if (client.slaGroupName && shared.monitor) {
    const match = (m: { group: string }) => `V4 Company + ${m.group}` === client.slaGroupName || m.group === client.slaGroupName;
    const urgent = shared.monitor.urgent.find(match);
    const attention = shared.monitor.attention.find(match);
    att.push({
      label: "Alerta de resposta (agora)",
      value: urgent ? "Urgente" : attention ? "Atenção" : "Sem alerta",
      points: urgent ? 25 : attention ? 60 : 90,
      source: "Monitor de SLA (WhatsApp) — estado atual, sem histórico",
      problem: urgent ? "cliente sem resposta em nível urgente" : attention ? "cliente aguardando resposta (ponto de atenção)" : undefined,
      action: urgent || attention ? "Responder o cliente no grupo de WhatsApp agora" : undefined,
    });
  }

  // ---- Operação: tarefas do eKyte ----
  const ops: Indicator[] = [];
  if (client.ekyteClientName) {
    const tasks = shared.ekyteTasks.filter((t) => t.client === client.ekyteClientName);
    const open = tasks.filter((t) => t.situation === 10 || t.situation === 20);
    const overdue = tasks.filter(isEkyteOverdue);
    const cutoff = new Date(now.getTime() - 30 * 86400000).toISOString().slice(0, 10);
    const recent = tasks.filter((t) => t.date >= cutoff);
    if (recent.length + open.length >= 3) {
      const share = open.length > 0 ? overdue.length / open.length : 0;
      ops.push({
        label: "Tarefas atrasadas",
        value: `${overdue.length} de ${open.length} em aberto`,
        points: Math.round(100 - share * 100),
        source: "eKyte (snapshot)",
        problem: overdue.length > 0 ? `${overdue.length} entrega(s) atrasada(s)` : undefined,
        action: overdue.length > 0 ? "Revisar entregas atrasadas com o responsável" : undefined,
      });
    }
  }

  // ---- Relacionamento ----
  const rel: Indicator[] = [];
  const hasRelSignal = notes.length > 0 || active.some((e) => e.nextCheckin || e.stakeholderRelationship || e.hsUpToDate);
  if (hasRelSignal) {
    rel.push({
      label: "Acompanhamentos nos últimos 30 dias",
      value: String(notes.length),
      points: notes.length >= 2 ? 100 : notes.length === 1 ? 70 : 30,
      source: "Notas do Account",
      problem: notes.length === 0 ? "nenhum acompanhamento registrado em 30 dias" : undefined,
      action: notes.length === 0 ? "Registrar check-in ou reunião com o cliente" : undefined,
    });
    const next = active.map((e) => e.nextCheckin).filter((d): d is Date => !!d).sort((a, b) => a.getTime() - b.getTime())[0];
    if (next) {
      const overdue = next < now;
      rel.push({
        label: "Próximo check-in",
        value: overdue ? "vencido" : "agendado",
        points: overdue ? 30 : 100,
        source: "Health Score (próximo check-in)",
        problem: overdue ? "check-in vencido" : undefined,
        action: overdue ? "Reagendar o check-in com o cliente" : undefined,
      });
    }
    const stake = active.find((e) => e.stakeholderRelationship);
    if (stake) {
      const risk = stake.stakeholderRelationship!.toLowerCase().startsWith("risco");
      rel.push({
        label: "Relação com stakeholder",
        value: stake.stakeholderRelationship!,
        points: risk ? 20 : 100,
        source: "Avaliação do Account",
        problem: risk ? "relacionamento com stakeholder em risco" : undefined,
        action: risk ? "Montar plano de ação de relacionamento" : undefined,
      });
    }
  }

  const dimensions: Record<"performance" | "atendimento" | "operacao" | "relacionamento", DimensionResult> = {
    performance: scoreFromIndicators(perf),
    atendimento: scoreFromIndicators(att),
    operacao: scoreFromIndicators(ops),
    relacionamento: scoreFromIndicators(rel),
  };
  return computeHealth(dimensions, config, { createdAt: client.createdAt, now });
}
