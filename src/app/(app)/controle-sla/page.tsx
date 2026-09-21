import { requireStaffModule } from "@/lib/session";
import { PageHeader } from "@/components/layout/page-header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SlaDashboardView } from "@/components/admin/sla/sla-dashboard-view";
import { SlaOverviewView } from "@/components/admin/sla/sla-overview-view";
import { SlaNotificationsView } from "@/components/admin/sla/sla-notifications-view";
import { SlaReportsView } from "@/components/admin/sla/sla-reports-view";
import { getSlaMonitor, getSlaGroups, getSlaAttendance, getSlaReports } from "@/lib/data/sla";
import { listTeamMembers } from "@/lib/data/team";
import { RefreshNowButton } from "@/components/admin/refresh-now-button";

// One route, four tabs — replaces the old ?view=dashboard|overview|notifications|reports
// dispatch (four separate nav entries pointing at what read, from the menu, as four different
// "SLA" pages). Same components, same data, just presented as tabs of one page instead of
// stops on their own URLs.
export default async function ControleSlaPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; client?: string; from?: string; to?: string }>;
}) {
  await requireStaffModule("controle_sla");
  const params = await searchParams;
  const period = params.period ?? "30d";
  const client = params.client ?? "";
  const from = params.from;
  const to = params.to;

  const [groups, attendance, monitor, reports, team] = await Promise.all([
    getSlaGroups(),
    getSlaAttendance(),
    getSlaMonitor(),
    getSlaReports(),
    listTeamMembers(),
  ]);

  return (
    <div>
      <PageHeader
        title="SLA"
        description="Tempo de resposta, alertas e automações de atendimento no WhatsApp"
        actions={<RefreshNowButton />}
      />

      <Tabs urlParam="tab" defaultValue="visao-geral">
        <TabsList>
          <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
          <TabsTrigger value="notificacoes">Notificações</TabsTrigger>
          <TabsTrigger value="automacoes">Equipe & Automações</TabsTrigger>
          <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="visao-geral">
          <SlaDashboardView groups={groups} attendance={attendance} monitor={monitor} period={period} client={client} from={from} to={to} />
        </TabsContent>

        <TabsContent value="notificacoes">
          <SlaNotificationsView
            attention={monitor ? monitor.attention : null}
            urgent={monitor ? monitor.urgent : null}
            connected={monitor !== null}
          />
        </TabsContent>

        <TabsContent value="automacoes">
          <SlaOverviewView groups={groups} attendance={attendance} reports={reports} team={team} />
        </TabsContent>

        <TabsContent value="relatorios">
          <SlaReportsView reports={reports} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
