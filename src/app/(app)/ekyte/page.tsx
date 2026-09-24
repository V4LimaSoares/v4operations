import { requireStaffModule } from "@/lib/session";
import { PageHeader } from "@/components/layout/page-header";
import { EkyteDateFilter } from "@/components/ekyte/ekyte-date-filter";
import { EkyteDashboardSection } from "@/components/ekyte/ekyte-dashboard-section";
import { EkyteTasksSection } from "@/components/ekyte/ekyte-tasks-section";
import { EkyteRelatorioSection } from "@/components/ekyte/ekyte-relatorio-section";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getEkyteSnapshot } from "@/lib/data/ekyte";
import { EkyteRefreshButton } from "@/components/ekyte/ekyte-refresh-button";
import { formatDateTime } from "@/lib/utils";

// One route, three tabs — replaces the old /ekyte/dashboard, /ekyte/tasks, /ekyte/relatorio
// (three separate nav entries for what's really one module: the agency's production data,
// sourced from Ekyte). Same section components, same data, same period filter shared across all
// three via the URL — just presented as tabs of one page instead of stops on their own URLs.
export default async function OperacaoPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string; client?: string; format?: string; status?: string; q?: string }>;
}) {
  await requireStaffModule("ekyte");
  const params = await searchParams;
  const snapshot = await getEkyteSnapshot();

  return (
    <div>
      <PageHeader
        title="Operação"
        description={`Tarefas e produção da agência, com dados via Ekyte · atualizado em ${formatDateTime(snapshot.generatedAt)}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <EkyteDateFilter />
            <EkyteRefreshButton />
          </div>
        }
      />

      <Tabs urlParam="tab" defaultValue="visao-geral">
        <TabsList>
          <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
          <TabsTrigger value="tarefas">Tarefas</TabsTrigger>
          <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="visao-geral">
          <EkyteDashboardSection params={params} />
        </TabsContent>

        <TabsContent value="tarefas">
          <EkyteTasksSection params={params} />
        </TabsContent>

        <TabsContent value="relatorios">
          <EkyteRelatorioSection params={params} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
