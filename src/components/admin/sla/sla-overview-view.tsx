import Link from "next/link";
import { Users, Zap, AlertTriangle, Clock, Check } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card } from "@/components/ui/card";
import { AutomationCard } from "@/components/admin/sla/automation-card";
import { TEAM, AUTOMATIONS, type AttendanceData, type ReportSend, type SlaGroup } from "@/lib/data/sla";
import type { listTeamMembers } from "@/lib/data/team";

export function SlaOverviewView({
  groups,
  attendance,
  reports,
  team,
}: {
  groups: SlaGroup[] | null;
  attendance: AttendanceData | null;
  reports: ReportSend[] | null;
  /** Used only to resolve each SLA person's unified Equipes page id for the "Equipe · foco" links. */
  team: Awaited<ReturnType<typeof listTeamMembers>>;
}) {
  const groupCount = groups?.length ?? (attendance ? Object.keys(attendance.clients).length : 0);
  const totalAlerts = attendance
    ? Object.values(attendance.team).reduce((sum, p) => sum + p.kpi.alerts, 0)
    : 0;

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Grupos monitorados" value={groupCount} icon={Users} formatter={(v) => String(v)} />
        <StatCard label="Automações ativas" value={3} icon={Zap} formatter={() => "3 / 3"} />
        <StatCard label="Alertas no período" value={totalAlerts} icon={AlertTriangle} formatter={(v) => String(v)} />
        <StatCard label="Próximo envio" value={0} icon={Clock} formatter={() => "Hoje, 19:00"} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between border-b border-border p-4">
            <h3 className="text-sm font-semibold">Envios recentes</h3>
            <span className="text-xs text-muted">todos confirmados</span>
          </div>
          <div className="divide-y divide-border">
            {!reports || reports.length === 0 ? (
              <p className="p-4 text-sm text-muted">Sem envios registrados ainda.</p>
            ) : (
              reports.slice(0, 4).map((r, i) => (
                <div key={i} className="flex items-center gap-3 p-4">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-positive-soft text-positive">
                    <Check className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{r.type}</div>
                    <div className="text-xs text-muted">para {r.dest}</div>
                  </div>
                  <div className="shrink-0 text-xs text-muted">{r.date}</div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <div className="border-b border-border p-4">
            <h3 className="text-sm font-semibold">Equipe · foco</h3>
          </div>
          <div className="divide-y divide-border">
            {Object.values(TEAM).map((p) => {
              const stats = attendance?.team[p.key];
              const memberId = team.find((m) => m.name === p.name)?.id;
              return (
                <Link
                  key={p.key}
                  href={memberId ? `/equipes/${memberId}` : "/equipes"}
                  className="flex items-center gap-3 p-4 transition-colors hover:bg-surface-2"
                >
                  <div
                    className="flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ background: p.colorVar }}
                  >
                    {p.name[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{p.name}</div>
                    <div className="text-xs text-muted">
                      {p.role} · {stats?.kpi.atend ?? 0} atendimentos
                    </div>
                  </div>
                  <div className="shrink-0 text-xs text-muted">
                    {stats?.kpi.alerts ? `${stats.kpi.alerts} alertas` : "sem alertas"}
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="mt-6 mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Automações</h3>
        <span className="text-xs text-muted">VPS 86.48.18.68 · Docker Swarm / cron</span>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {AUTOMATIONS.map((a) => (
          <AutomationCard key={a.key} automation={a} />
        ))}
      </div>
    </div>
  );
}
