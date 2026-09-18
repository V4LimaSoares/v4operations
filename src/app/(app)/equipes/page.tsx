import { requireStaffModule } from "@/lib/session";
import { listTeamMembers, listAvailableUsersForTeam } from "@/lib/data/team";
import { listSquads, getSquadMrrAndChurn, squadTaskSummary, squadSlaAlertSummary } from "@/lib/data/squads";
import { getSlaMonitor } from "@/lib/data/sla";
import { EquipesTabsSection } from "@/components/admin/equipes-tabs-section";
import type { SquadCardData } from "@/components/admin/squad-card";

// "Equipes" (cadastro de pessoas) and "Squad" (grupos de pessoas + carteira de clientes) merged
// into one route with tabs — same move já feito pra SLA/Operação e Clientes/Health Score.
export default async function EquipesPage() {
  await requireStaffModule("equipes");
  const [team, squads, monitor, availableUsers] = await Promise.all([
    listTeamMembers(),
    listSquads(),
    getSlaMonitor(),
    listAvailableUsersForTeam(),
  ]);

  const squadCards: SquadCardData[] = await Promise.all(
    squads.map(async (s) => {
      const clientIds = s.clients.map((c) => c.clientId);
      const { mrrBrl, avgChurnPct } = await getSquadMrrAndChurn(clientIds);
      const ekyteNames = new Set(s.clients.map((c) => c.client.ekyteClientName).filter((v): v is string => !!v));
      const slaNames = new Set(s.clients.map((c) => c.client.slaGroupName).filter((v): v is string => !!v));
      return {
        id: s.id,
        name: s.name,
        logoUrl: s.logoUrl,
        members: s.members.map((m) => ({ id: m.teamMember.id, name: m.teamMember.name, colorVar: m.teamMember.colorVar, role: m.role })),
        clientCount: s.clients.length,
        mrrBrl,
        avgChurnPct,
        tasks: await squadTaskSummary(ekyteNames),
        sla: squadSlaAlertSummary(slaNames, monitor),
      };
    })
  );

  return (
    <div>
      <EquipesTabsSection team={team} squadCards={squadCards} availableUsers={availableUsers} />
    </div>
  );
}
