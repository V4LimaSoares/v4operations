import "server-only";
import { prisma } from "@/lib/prisma";
import { getEkyteSnapshot, isEkyteOverdue } from "@/lib/data/ekyte";
import type { MonitorData } from "@/lib/sla-config";

const squadInclude = {
  members: {
    include: { teamMember: { select: { id: true, name: true, colorVar: true } } },
    orderBy: { teamMember: { name: "asc" as const } },
  },
  clients: {
    include: {
      client: { select: { id: true, name: true, company: true, ekyteClientName: true, slaGroupName: true } },
    },
    orderBy: { client: { name: "asc" as const } },
  },
};

export async function listSquads() {
  return prisma.squad.findMany({ orderBy: { name: "asc" }, include: squadInclude });
}

export async function getSquadById(id: string) {
  return prisma.squad.findUnique({ where: { id }, include: squadInclude });
}

/** Sums Fee mensal and averages churn probability across an arbitrary set of clients — no
 *  equivalent exists in health-score.ts, which only aggregates for a single clientId at a time. */
export async function getSquadMrrAndChurn(clientIds: string[]) {
  if (clientIds.length === 0) return { mrrBrl: 0, avgChurnPct: null as number | null };
  const entries = await prisma.healthScoreEntry.findMany({
    where: { clientId: { in: clientIds } },
    select: { feeBrl: true, churnProbabilityPct: true },
  });
  const mrrBrl = entries.reduce((sum, e) => sum + (e.feeBrl ?? 0), 0);
  const churnValues = entries.map((e) => e.churnProbabilityPct).filter((v): v is number => v != null);
  const avgChurnPct = churnValues.length ? churnValues.reduce((a, b) => a + b, 0) / churnValues.length : null;
  return { mrrBrl, avgChurnPct };
}

/** Task counts from the Ekyte snapshot for the squad's clients, joined by ekyteClientName — same
 *  string-match convention already used for a single client/person in clientes/[id] and
 *  equipes/[id]. */
export async function squadTaskSummary(ekyteClientNames: Set<string>) {
  const { tasks: allTasks } = await getEkyteSnapshot();
  const tasks = allTasks.filter((t) => ekyteClientNames.has(t.client));
  return {
    total: tasks.length,
    open: tasks.filter((t) => t.situation === 10 || t.situation === 20).length,
    overdue: tasks.filter(isEkyteOverdue).length,
    done: tasks.filter((t) => t.situation === 30).length,
  };
}

/** Real SLA metrics (response time, % within SLA) only exist per person, not per client/group —
 *  so this is honestly just a count of the squad's WhatsApp groups currently flagged in the SLA
 *  monitor, not a fabricated compliance percentage. */
export function squadSlaAlertSummary(slaGroupNames: Set<string>, monitor: MonitorData | null) {
  if (!monitor) return { attention: 0, urgent: 0 };
  return {
    attention: monitor.attention.filter((m) => slaGroupNames.has(m.group)).length,
    urgent: monitor.urgent.filter((m) => slaGroupNames.has(m.group)).length,
  };
}
