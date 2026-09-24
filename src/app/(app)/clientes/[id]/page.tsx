import { notFound } from "next/navigation";
import Link from "next/link";
import { requireStaffModule } from "@/lib/session";
import { getClientById } from "@/lib/data/clients";
import { listClientOptions } from "@/lib/scope";
import { listTeamMembers } from "@/lib/data/team";
import { getHealthScoreEntriesByClientId } from "@/lib/data/health-score";
import { listAccountNotes } from "@/lib/data/account-notes";
import { presetToRange } from "@/lib/data/metrics";
import { getSummaryWithComparison, getDailyTimeSeries, getCampaignPerformance } from "@/lib/data/metrics";
import { getSlaMonitor, getSlaGroups } from "@/lib/data/sla";
import { getEkyteSnapshot, ekyteFmtHours, isEkyteOverdue } from "@/lib/data/ekyte";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { TimeSeriesChart } from "@/components/dashboard/time-series-chart";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClientStatusBadge, PlatformBadge, DataSourceBadge } from "@/components/dashboard/badges";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { TeamLinkPanel } from "@/components/admin/team-link-panel";
import { ClientPortfolioPanel } from "@/components/admin/client-portfolio-panel";
import { listPortfolioItems } from "@/lib/data/portfolio";
import { AccountNotesPanel } from "@/components/admin/account-notes-panel";
import { EditClientDialog } from "@/components/admin/edit-client-dialog";
import { HealthScoreDialog } from "@/components/admin/health-score-dialog";
import { toHealthScoreFormEntry } from "@/lib/health-score-form";
import { LastModified } from "@/components/admin/last-modified";
import { RefreshNowButton } from "@/components/admin/refresh-now-button";
import { formatBRL, formatNumber, formatPercent, formatDate } from "@/lib/utils";
import { Wallet, Receipt, TrendingUp, Target } from "lucide-react";

function flagVariant(flag: string | null): "positive" | "warning" | "negative" | "default" {
  const f = (flag ?? "").toLowerCase();
  if (f.startsWith("risco iminente")) return "negative";
  if (f.startsWith("risco")) return "warning";
  if (f.startsWith("saud")) return "positive";
  return "default";
}

export default async function ClienteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaffModule("clientes");
  const { id } = await params;
  const [client, allTeam, healthEntries, accountNotes, allPortfolioItems] = await Promise.all([
    getClientById(id),
    listTeamMembers(),
    getHealthScoreEntriesByClientId(id),
    listAccountNotes(id),
    listPortfolioItems(),
  ]);
  if (!client) notFound();

  const range = presetToRange("30d");
  const scope = { clientId: client.id, isAggregate: false as const };
  const [{ current, previous }, series, campaigns] = await Promise.all([
    getSummaryWithComparison(scope, range),
    getDailyTimeSeries(scope, range),
    getCampaignPerformance(scope, range),
  ]);

  const linkedTeam = client.teamMembers.map((t) => ({ ...t.teamMember, role: t.role }));
  const squad = client.squads[0]?.squad ?? null;
  const linkedPortfolio = client.portfolioItems.map((p) => p.item);

  return (
    <div>
      <PageHeader
        title={client.name}
        description={client.company}
        backHref="/clientes"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ClientStatusBadge status={client.status} />
            <RefreshNowButton />
            <EditClientDialog client={client} />
          </div>
        }
      />
      <LastModified entityType="Cliente" entityId={client.id} />

      <Tabs defaultValue="visao-geral">
        <TabsList>
          <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="sla">SLA</TabsTrigger>
          <TabsTrigger value="account">Health Score{healthEntries.length > 0 && <Badge className="ml-1.5">{healthEntries.length}</Badge>}</TabsTrigger>
          <TabsTrigger value="operacao">Operação</TabsTrigger>
          <TabsTrigger value="equipe">Equipe{linkedTeam.length > 0 && <Badge className="ml-1.5">{linkedTeam.length}</Badge>}</TabsTrigger>
          <TabsTrigger value="portfolio">Portfólio{linkedPortfolio.length > 0 && <Badge className="ml-1.5">{linkedPortfolio.length}</Badge>}</TabsTrigger>
          <TabsTrigger value="integracoes">Integrações{client.adAccounts.length > 0 && <Badge className="ml-1.5">{client.adAccounts.length}</Badge>}</TabsTrigger>
        </TabsList>

        <TabsContent value="visao-geral">
          <OverviewTab
            client={client}
            current={current}
            healthEntries={healthEntries}
            linkedTeam={linkedTeam}
            squad={squad}
          />
        </TabsContent>

        <TabsContent value="performance">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard label="Investimento" value={current.costBrl} previousValue={previous.costBrl} icon={Wallet} formatter={formatBRL} />
            <StatCard label="Faturamento" value={current.revenueBrl} previousValue={previous.revenueBrl} icon={Receipt} formatter={formatBRL} />
            <StatCard label="ROAS" value={current.roas} previousValue={previous.roas} icon={TrendingUp} formatter={(v) => `${v.toFixed(2)}x`} />
            <StatCard label="Conversões" value={current.conversions} previousValue={previous.conversions} icon={Target} formatter={(v) => formatNumber(v, 1)} />
          </div>
          <div className="mt-4">
            <TimeSeriesChart title="Investimento ao longo do tempo" data={series} metricKey="costBrl" format="brl" variant="area" color="var(--color-primary)" />
          </div>
          {campaigns.length > 0 && (
            <Card className="mt-4">
              <CardHeader><CardTitle>Campanhas</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campanha</TableHead>
                      <TableHead>Plataforma</TableHead>
                      <TableHead className="text-right">Investimento</TableHead>
                      <TableHead className="text-right">ROAS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.slice(0, 8).map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell className="text-muted">{c.platform === "GOOGLE_ADS" ? "Google Ads" : "Meta Ads"}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatBRL(c.costBrl)}</TableCell>
                        <TableCell className="text-right tabular-nums">{c.roas.toFixed(2)}x</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="sla">
          <SlaTab client={client} />
        </TabsContent>

        <TabsContent value="account">
          <HealthTab client={client} entries={healthEntries} />
          <div className="mt-6">
            <AccountNotesPanel
              clientId={client.id}
              notes={accountNotes.map((n) => ({ ...n, occurredAt: n.occurredAt.toISOString() }))}
            />
          </div>
        </TabsContent>

        <TabsContent value="operacao">
          <EkyteTab client={client} />
        </TabsContent>

        <TabsContent value="equipe">
          <Card className="mb-4 p-5">
            <h3 className="mb-3 text-sm font-semibold">Squad</h3>
            {squad ? (
              <Link href={`/equipes/squad/${squad.id}`} className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-2 py-1.5 pl-1.5 pr-3 text-sm font-medium hover:border-muted-2">
                <span className="flex size-6 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary">{squad.name[0]}</span>
                {squad.name}
              </Link>
            ) : (
              <p className="text-sm text-muted">Este cliente não pertence a nenhum squad ainda.</p>
            )}
          </Card>
          <Card className="p-5">
            <TeamLinkPanel clientId={client.id} linked={linkedTeam} available={allTeam} />
          </Card>
        </TabsContent>

        <TabsContent value="portfolio">
          <Card className="p-5">
            <ClientPortfolioPanel clientId={client.id} linked={linkedPortfolio} available={allPortfolioItems} />
          </Card>
        </TabsContent>

        <TabsContent value="integracoes">
          <IntegracoesTab client={client} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Executive summary — one glance at Performance/SLA/Account/Equipe, each linking to its own
// full tab. Deliberately shallow (a handful of numbers per block, not a second dashboard) —
// depth belongs in the tab it summarizes.
function OverviewTab({
  client,
  current,
  healthEntries,
  linkedTeam,
  squad,
}: {
  client: { slaGroupName: string | null; ekyteClientName: string | null };
  current: { costBrl: number; revenueBrl: number; roas: number };
  healthEntries: Awaited<ReturnType<typeof getHealthScoreEntriesByClientId>>;
  linkedTeam: { id: string; name: string; colorVar: string }[];
  squad: { id: string; name: string } | null;
}) {
  const latestHealth = healthEntries[0] ?? null;
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card className="p-5">
        <h3 className="mb-3 text-sm font-semibold">Performance (30d)</h3>
        <div className="grid grid-cols-3 gap-4">
          <Info label="Investimento" value={formatBRL(current.costBrl)} />
          <Info label="Faturamento" value={formatBRL(current.revenueBrl)} />
          <Info label="ROAS" value={`${current.roas.toFixed(2)}x`} />
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="mb-3 text-sm font-semibold">SLA</h3>
        {client.slaGroupName ? (
          <Info label="Grupo de WhatsApp" value={client.slaGroupName} />
        ) : (
          <p className="text-sm text-muted">Sem grupo de SLA vinculado.</p>
        )}
      </Card>

      <Card className="p-5">
        <h3 className="mb-3 text-sm font-semibold">Health Score</h3>
        {latestHealth ? (
          <div className="grid grid-cols-2 gap-4">
            <Info label="Fee mensal" value={latestHealth.feeBrl != null ? formatBRL(latestHealth.feeBrl) : "—"} />
            <Info label="Flag" value={latestHealth.flag ?? "—"} />
          </div>
        ) : (
          <p className="text-sm text-muted">Sem registro de Health Score ainda.</p>
        )}
      </Card>

      <Card className="p-5">
        <h3 className="mb-3 text-sm font-semibold">Squad</h3>
        {squad ? (
          <Link href={`/equipes/squad/${squad.id}`} className="text-sm font-medium text-primary hover:underline">
            {squad.name}
          </Link>
        ) : (
          <p className="text-sm text-muted">Sem squad vinculado.</p>
        )}
      </Card>

      <Card className="p-5">
        <h3 className="mb-3 text-sm font-semibold">Equipe</h3>
        {linkedTeam.length === 0 ? (
          <p className="text-sm text-muted">Nenhuma pessoa vinculada ainda.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {linkedTeam.map((m) => (
              <span key={m.id} className="flex items-center gap-1.5 rounded-full border border-border bg-surface-2 py-1 pl-1 pr-2.5 text-xs">
                <span
                  className="flex size-4 items-center justify-center rounded-full text-[9px] font-bold text-white"
                  style={{ background: m.colorVar }}
                >
                  {m.name[0]}
                </span>
                {m.name}
              </span>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function IntegracoesTab({
  client,
}: {
  client: { adAccounts: { id: string; platform: "GOOGLE_ADS" | "META_ADS"; name: string; dataSource: "DEMO" | "REAL"; externalId: string }[] };
}) {
  if (client.adAccounts.length === 0) {
    return <Card className="p-8 text-center text-sm text-muted">Nenhuma conta de anúncio conectada para este cliente ainda.</Card>;
  }
  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Conta</TableHead>
            <TableHead>Plataforma</TableHead>
            <TableHead>ID externo</TableHead>
            <TableHead>Origem</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {client.adAccounts.map((a) => (
            <TableRow key={a.id}>
              <TableCell className="font-medium">{a.name}</TableCell>
              <TableCell><PlatformBadge platform={a.platform} /></TableCell>
              <TableCell className="font-mono text-xs text-muted">{a.externalId}</TableCell>
              <TableCell><DataSourceBadge dataSource={a.dataSource} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

async function HealthTab({
  client,
  entries,
}: {
  client: { id: string };
  entries: Awaited<ReturnType<typeof getHealthScoreEntriesByClientId>>;
}) {
  const clientOptions = await listClientOptions();
  return (
    <div>
      <div className="mb-3 flex justify-end">
        <HealthScoreDialog clients={clientOptions} defaultClientId={client.id} />
      </div>
      {entries.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted">
          Nenhum registro de Health Score para este cliente ainda.
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {entries.map((e) => (
            <Card key={e.id} className="p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold">{e.product ?? "Produto não definido"}</span>
                  <Badge variant={e.phase.toLowerCase() === "churn" ? "negative" : "default"}>{e.phase}</Badge>
                  {e.flag && <Badge variant={flagVariant(e.flag)}>{e.flag}</Badge>}
                </div>
                <HealthScoreDialog clients={clientOptions} entry={toHealthScoreFormEntry(e)} />
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Info label="Fee mensal" value={e.feeBrl != null ? formatBRL(e.feeBrl) : "—"} />
                <Info label="Probabilidade de churn" value={e.churnProbabilityPct != null ? formatPercent(e.churnProbabilityPct) : "—"} />
                <Info label="HS em dia?" value={e.hsUpToDate ?? "—"} />
                <Info label="Próximo check-in" value={e.nextCheckin ? formatDate(e.nextCheckin) : "—"} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </div>
  );
}

async function SlaTab({ client }: { client: { slaGroupName: string | null } }) {
  if (!client.slaGroupName) {
    return <Card className="p-8 text-center text-sm text-muted">Este cliente não está vinculado a nenhum grupo de SLA.</Card>;
  }
  const [groups, monitor] = await Promise.all([getSlaGroups(), getSlaMonitor()]);
  const group = groups?.find((g) => g.name === client.slaGroupName);
  const attention = monitor?.attention.find((m) => `V4 Company + ${m.group}` === client.slaGroupName || m.group === client.slaGroupName);
  const urgent = monitor?.urgent.find((m) => `V4 Company + ${m.group}` === client.slaGroupName || m.group === client.slaGroupName);

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-5">
        <div className="text-xs font-medium uppercase tracking-wide text-muted">Grupo de WhatsApp</div>
        <div className="mt-1 text-sm font-semibold">{client.slaGroupName}</div>
        {!group && <p className="mt-2 text-xs text-warning">Grupo não encontrado na lista ao vivo (pode ter sido renomeado).</p>}
      </Card>
      {(attention || urgent) ? (
        <Card className="flex items-start gap-3 border-negative/30 bg-negative-soft p-4">
          <div className="text-sm text-foreground">
            {urgent ? <><b>Urgente:</b> esperando desde {urgent.since} ({urgent.elapsed}).</> : null}
            {attention ? <><b>Ponto de atenção:</b> esperando desde {attention.since} ({attention.elapsed}).</> : null}
          </div>
        </Card>
      ) : (
        <Card className="p-5 text-sm text-muted">Nenhum alerta ativo agora para este grupo.</Card>
      )}
    </div>
  );
}

async function EkyteTab({ client }: { client: { ekyteClientName: string | null } }) {
  if (!client.ekyteClientName) {
    return <Card className="p-8 text-center text-sm text-muted">Este cliente não está vinculado a nenhum cliente do Ekyte.</Card>;
  }
  const { tasks: allTasks, timeTrackings: allTime } = await getEkyteSnapshot();
  const tasks = allTasks.filter((t) => t.client === client.ekyteClientName);
  const time = allTime.filter((t) => t.client === client.ekyteClientName);
  const minutes = time.reduce((a, b) => a + b.minutes, 0);
  const done = tasks.filter((t) => t.situation === 30).length;
  const late = tasks.filter(isEkyteOverdue).length;

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Tarefas" value={tasks.length} icon={Target} formatter={(v) => String(v)} />
        <StatCard label="Concluídas" value={done} icon={TrendingUp} formatter={(v) => String(v)} />
        <StatCard label="Atrasadas" value={late} icon={Wallet} formatter={(v) => String(v)} />
        <StatCard label="Horas apontadas" value={0} icon={Receipt} formatter={() => `${ekyteFmtHours(minutes)}h`} />
      </div>
      {tasks.length > 0 && (
        <Card className="mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tarefa</TableHead>
                <TableHead>Executor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Vencimento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.slice(0, 15).map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.type}</TableCell>
                  <TableCell className="text-muted">{t.executor}</TableCell>
                  <TableCell>
                    <Badge variant={t.situation === 30 ? "positive" : isEkyteOverdue(t) ? "negative" : "default"}>
                      {t.situation === 30 ? "Concluída" : isEkyteOverdue(t) ? "Atrasada" : "Ativa"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted">{t.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
