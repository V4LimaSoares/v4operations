import { notFound } from "next/navigation";
import { requireStaffModule } from "@/lib/session";
import { getTeamMemberById } from "@/lib/data/team";
import { listClientOptions } from "@/lib/scope";
import { getSlaAttendance, TEAM as SLA_TEAM, lastBusinessDays } from "@/lib/data/sla";
import { getEkyteSnapshot, ekyteCanonicalName, ekyteClientDetail, ekyteFmtHours } from "@/lib/data/ekyte";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { TimeSeriesChart } from "@/components/dashboard/time-series-chart";
import { DonutChart } from "@/components/dashboard/donut-chart";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { ClientLinkPanel } from "@/components/admin/client-link-panel";
import { TeamMemberDialog } from "@/components/admin/team-member-dialog";
import { TeamAvatar } from "@/components/admin/team-avatar";
import { Clock, Target, Users, AlertTriangle, ListChecks, CheckCircle2, Timer, Cake, CalendarCheck, Mail, MapPin } from "lucide-react";
import { formatDateOnly } from "@/lib/utils";

export default async function EquipeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaffModule("equipes");
  const { id } = await params;
  const [member, allClients] = await Promise.all([getTeamMemberById(id), listClientOptions()]);
  if (!member) notFound();

  const linked = member.clients.map((c) => ({ ...c.client, role: c.role }));

  // SLA: this roster and Ekyte's snapshot both key people by their real name — join on that.
  const slaKey = (Object.keys(SLA_TEAM) as (keyof typeof SLA_TEAM)[]).find((k) => SLA_TEAM[k].name === member.name);
  const attendance = slaKey ? await getSlaAttendance() : null;
  const slaStats = slaKey && attendance ? attendance.team[slaKey] : null;

  // Ekyte: filter the pulled snapshot to this person's tasks/time entries.
  const { tasks: allEkyteTasks, timeTrackings: allEkyteTime } = await getEkyteSnapshot();
  const ekyteTasks = allEkyteTasks.filter((t) => ekyteCanonicalName(t.executor) === member.name);
  const ekyteTime = allEkyteTime.filter((t) => ekyteCanonicalName(t.executor) === member.name);
  const ekyteDone = ekyteTasks.filter((t) => t.situation === 30).length;
  const ekyteMinutes = ekyteTime.reduce((a, b) => a + b.minutes, 0);
  const ekyteClients = ekyteClientDetail(ekyteTasks, ekyteTime);

  const dates = lastBusinessDays(slaStats?.responseMin.length ?? 14);
  const responseSeries = dates.map((date, i) => ({ date, minutos: slaStats?.responseMin[i] ?? 0 }));
  const donutData = (slaStats?.donut ?? []).map((d) => ({ name: d.label, value: d.value, color: d.color }));

  return (
    <div>
      <PageHeader
        title={member.name}
        description={member.role}
        backHref="/equipes"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <TeamAvatar id={member.id} name={member.name} colorVar={member.colorVar} photoUrl={member.photoUrl} className="size-11" />
            <TeamMemberDialog
              member={{
                id: member.id,
                name: member.name,
                role: member.role,
                colorVar: member.colorVar,
                photoUrl: member.photoUrl,
                userId: member.userId,
                birthDate: member.birthDate,
                hireDate: member.hireDate,
                address: member.address,
                email: member.email,
              }}
            />
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-3 text-sm font-semibold">Clientes vinculados</div>
          <ClientLinkPanel teamMemberId={member.id} linked={linked} available={allClients} />
        </Card>

        <Card className="p-5">
          <div className="mb-3 text-sm font-semibold">Resumo</div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <SummaryStat icon={Users} label="Clientes" value={String(linked.length)} />
            <SummaryStat icon={ListChecks} label="Tarefas Ekyte (período)" value={String(ekyteTasks.length)} />
            <SummaryStat icon={CheckCircle2} label="Concluídas" value={String(ekyteDone)} />
            <SummaryStat icon={Timer} label="Horas apontadas" value={`${ekyteFmtHours(ekyteMinutes)}h`} />
          </div>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <div className="mb-3 text-sm font-semibold">Dados pessoais</div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <PersonalField icon={Cake} label="Aniversário" value={member.birthDate ? formatDateOnly(member.birthDate) : "—"} />
            <PersonalField icon={CalendarCheck} label="Contratação" value={member.hireDate ? formatDateOnly(member.hireDate) : "—"} />
            <PersonalField icon={Mail} label="E-mail" value={member.email ?? "—"} />
            <PersonalField icon={MapPin} label="Endereço" value={member.address ?? "—"} />
          </div>
        </Card>
      </div>

      {slaStats && (
        <div className="mt-6">
          <h2 className="mb-3 text-sm font-semibold">Controle de SLA</h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Tempo médio de resposta" value={0} icon={Clock} formatter={() => `${slaStats.kpi.avgResp}min`} />
            <StatCard label="Dentro do SLA" value={0} icon={Target} formatter={() => `${slaStats.kpi.withinSla}%`} />
            <StatCard label="Atendimentos" value={slaStats.kpi.atend} icon={Users} formatter={(v) => String(v)} />
            <StatCard label="Alertas recebidos" value={slaStats.kpi.alerts} icon={AlertTriangle} formatter={(v) => String(v)} />
          </div>
          {slaStats.kpi.atend > 0 && (
            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <TimeSeriesChart title="Tempo de resposta ao longo do tempo" data={responseSeries} metricKey="minutos" format="number" variant="line" color={member.colorVar} />
              <DonutChart title="Classificação SLA" data={donutData} format="number" />
            </div>
          )}
        </div>
      )}

      {ekyteTasks.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 text-sm font-semibold">Ekyte — produção por cliente</h2>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-right">Tarefas</TableHead>
                  <TableHead className="text-right">Concluídas</TableHead>
                  <TableHead className="text-right">Atrasadas</TableHead>
                  <TableHead className="text-right">Horas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ekyteClients.map((row) => (
                  <TableRow key={row.client}>
                    <TableCell className="font-medium">{row.client}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.n}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.done}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.late}</TableCell>
                    <TableCell className="text-right tabular-nums">{ekyteFmtHours(row.minutes)}h</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {!slaStats && ekyteTasks.length === 0 && (
        <Card className="mt-6 p-8 text-center text-sm text-muted">
          Sem atividade registrada em Controle de SLA ou Ekyte para esta pessoa ainda.
        </Card>
      )}
    </div>
  );
}

function SummaryStat({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface-2 p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted">
        <Icon className="size-3.5" /> {label}
      </div>
      <div className="mt-1 text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}

/** Same card treatment as SummaryStat, but for values that are text rather than a stat — an
 *  email or address is neither short nor numeric, so no tabular-nums and no forced single line. */
function PersonalField({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface-2 p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted">
        <Icon className="size-3.5" /> {label}
      </div>
      <div className="mt-1 break-words text-sm font-medium">{value}</div>
    </div>
  );
}
