import { notFound } from "next/navigation";
import { BackLink } from "@/components/layout/back-link";
import Image from "next/image";
import { Wallet, Percent, ListChecks, ShieldAlert, Users } from "lucide-react";
import { requireStaffModule } from "@/lib/session";
import { getSquadById, getSquadMrrAndChurn, squadTaskSummary, squadSlaAlertSummary } from "@/lib/data/squads";
import { getSlaMonitor } from "@/lib/data/sla";
import { listTeamMembers } from "@/lib/data/team";
import { listClientOptions } from "@/lib/scope";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { SquadMemberPanel } from "@/components/admin/squad-member-panel";
import { SquadClientPanel } from "@/components/admin/squad-client-panel";
import { SquadDetailActions } from "@/components/admin/squad-detail-actions";
import { SquadStat } from "@/components/admin/squad-card";
import { LastModified } from "@/components/admin/last-modified";
import { RefreshNowButton } from "@/components/admin/refresh-now-button";
import { formatBRL, formatPercent } from "@/lib/utils";

export default async function SquadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaffModule("equipes");
  const { id } = await params;
  const [squad, allTeam, allClients, monitor] = await Promise.all([
    getSquadById(id),
    listTeamMembers(),
    listClientOptions(),
    getSlaMonitor(),
  ]);
  if (!squad) notFound();
  const takenElsewhere = new Set(
    (await prisma.squadClient.findMany({ where: { squadId: { not: id } }, select: { clientId: true } })).map((r) => r.clientId),
  );

  const linkedMembers = squad.members.map((m) => ({
    id: m.teamMember.id,
    name: m.teamMember.name,
    colorVar: m.teamMember.colorVar,
    role: m.role,
  }));
  const linkedClients = squad.clients.map((c) => ({ id: c.client.id, name: c.client.name, company: c.client.company }));
  const clientIds = squad.clients.map((c) => c.clientId);

  const { mrrBrl, avgChurnPct } = await getSquadMrrAndChurn(clientIds);
  const ekyteNames = new Set(squad.clients.map((c) => c.client.ekyteClientName).filter((v): v is string => !!v));
  const slaNames = new Set(squad.clients.map((c) => c.client.slaGroupName).filter((v): v is string => !!v));
  const tasks = await squadTaskSummary(ekyteNames);
  const sla = squadSlaAlertSummary(slaNames, monitor);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <BackLink fallbackHref="/equipes?tab=squad" />
            <div className="flex items-center gap-3">
              {squad.logoUrl ? (
                <Image
                  src={squad.logoUrl}
                  alt=""
                  width={56}
                  height={56}
                  className="size-14 shrink-0 rounded-2xl shadow-[0_6px_20px_-6px_rgba(0,0,0,0.4)]"
                />
              ) : (
                <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-xl font-bold text-primary">
                  {squad.name[0]}
                </div>
              )}
              <div>
                <h1 className="text-xl font-semibold tracking-tight">{squad.name}</h1>
                <p className="mt-0.5 text-sm text-muted">
                  {linkedMembers.length} pessoa{linkedMembers.length === 1 ? "" : "s"} · {linkedClients.length} cliente{linkedClients.length === 1 ? "" : "s"}
                </p>
                <LastModified entityType="Squad" entityId={squad.id} />
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <RefreshNowButton />
          <SquadDetailActions squad={{ id: squad.id, name: squad.name, logoUrl: squad.logoUrl }} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <SquadStat icon={Wallet} label="MRR gerenciado" value={formatBRL(mrrBrl)} />
        <SquadStat icon={Percent} label="Índice de churn" value={avgChurnPct != null ? formatPercent(avgChurnPct) : "—"} />
        <SquadStat icon={ListChecks} label="Tarefas (Ekyte)" value={`${tasks.open} abertas · ${tasks.overdue} atrasadas`} />
        <SquadStat icon={ShieldAlert} label="Alertas de SLA" value={`${sla.attention} atenção · ${sla.urgent} urgente`} />
        <SquadStat icon={Users} label="Clientes" value={String(linkedClients.length)} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Users className="size-4 text-muted" /> Membros
          </div>
          <SquadMemberPanel
            squadId={squad.id}
            linked={linkedMembers}
            available={allTeam.map((m) => ({ id: m.id, name: m.name, colorVar: m.colorVar }))}
          />
        </Card>

        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Wallet className="size-4 text-muted" /> Clientes
          </div>
          <SquadClientPanel squadId={squad.id} linked={linkedClients} available={allClients.filter((c) => !takenElsewhere.has(c.id))} />
        </Card>
      </div>
    </div>
  );
}
