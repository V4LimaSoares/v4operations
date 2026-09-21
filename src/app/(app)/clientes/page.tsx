import { Users, HeartPulse, AlertTriangle, Siren, Percent } from "lucide-react";
import { requireStaffModule } from "@/lib/session";
import { presetToRange } from "@/lib/data/metrics";
import { listClientsWithStats } from "@/lib/data/clients";
import { listTeamMembers } from "@/lib/data/team";
import { listHealthScoreEntries, getHealthScoreAggregate } from "@/lib/data/health-score";
import { listClientOptions } from "@/lib/scope";
import { PageHeader } from "@/components/layout/page-header";
import { NewClientDialog } from "@/components/admin/new-client-dialog";
import { ClientsTable } from "@/components/admin/clients-table";
import { HealthScoreTable } from "@/components/admin/health-score-table";
import { StatCard } from "@/components/dashboard/stat-card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatBRL, formatPercent } from "@/lib/utils";

function flagVariant(flag: string | null): "positive" | "warning" | "negative" | "default" {
  const f = (flag ?? "").toLowerCase();
  if (f.startsWith("risco iminente")) return "negative";
  if (f.startsWith("risco")) return "warning";
  if (f.startsWith("saud")) return "positive";
  return "default";
}

// "Clientes" and "Health Score" merged into one route with tabs — same move as SLA/Operação
// earlier: the two were separate top-level nav entries for what's really one audience (the
// agency's client roster), just two different views of it (cadastro vs. saúde da conta).
export default async function ClientesPage() {
  await requireStaffModule("clientes");
  const range = presetToRange("30d");
  const [clients, team, hsEntries, hsAggregate, clientOptions] = await Promise.all([
    listClientsWithStats(range),
    listTeamMembers(),
    listHealthScoreEntries(),
    getHealthScoreAggregate(),
    listClientOptions(),
  ]);

  const sortedHs = [...hsEntries].sort((a, b) => {
    const rank = (f: string | null) => (flagVariant(f) === "negative" ? 0 : flagVariant(f) === "warning" ? 1 : 2);
    return rank(a.flag) - rank(b.flag);
  });

  return (
    <div>
      <PageHeader title="Clientes" description="Todos os clientes cadastrados na agência" actions={<NewClientDialog team={team} />} />

      <Tabs urlParam="tab" defaultValue="clientes">
        <TabsList>
          <TabsTrigger value="clientes">Clientes</TabsTrigger>
          <TabsTrigger value="health-score">Health Score</TabsTrigger>
        </TabsList>

        <TabsContent value="clientes">
          <ClientsTable clients={clients} />
        </TabsContent>

        <TabsContent value="health-score">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard label="Clientes acompanhados" value={hsAggregate.totalClients} icon={Users} formatter={(v) => String(v)} />
            <StatCard label="Saudáveis" value={hsAggregate.healthy} icon={HeartPulse} formatter={(v) => String(v)} />
            <StatCard label="Em risco" value={hsAggregate.atRisk} icon={AlertTriangle} formatter={(v) => String(v)} invertDelta />
            <StatCard label="Risco iminente" value={hsAggregate.imminentRisk} icon={Siren} formatter={(v) => String(v)} invertDelta />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard label="Churn médio" value={hsAggregate.avgChurnProbability} icon={Percent} formatter={(v) => formatPercent(v)} invertDelta />
            <StatCard label="Fee total/mês" value={hsAggregate.totalFeeBrl} icon={Users} formatter={formatBRL} />
            <StatCard label="Health Score atrasado" value={hsAggregate.hsOverdueCount} icon={AlertTriangle} formatter={(v) => String(v)} invertDelta />
            <StatCard label="Em churn" value={hsAggregate.churn} icon={Siren} formatter={(v) => String(v)} invertDelta />
          </div>

          <HealthScoreTable entries={sortedHs} clients={clientOptions} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
