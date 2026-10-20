import Link from "next/link";
import { Users, Building2, Wallet, RefreshCw, AlertTriangle, ShieldAlert, Siren, Receipt, Landmark, PiggyBank } from "lucide-react";
import { requireStaffModule } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { presetToRange, getMetricsSummary, getSummaryWithComparison } from "@/lib/data/metrics";
import { getHealthScoreAggregate } from "@/lib/data/health-score";
import { getSlaMonitor } from "@/lib/data/sla";
import { getEkyteSnapshot, isEkyteOverdue } from "@/lib/data/ekyte";
import { ListChecks, UsersRound } from "lucide-react";
import { listRoyalties } from "@/lib/data/financeiro";
import { HealthSnapshotButton } from "@/components/admin/health-snapshot-button";
import { CLASSIFICATION_LABEL, type Classification } from "@/lib/health-score-engine";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { formatBRL, formatNumber, formatDate, formatDateOnly } from "@/lib/utils";

export default async function AdminOverviewPage() {
  const viewer = await requireStaffModule("admin_overview");
  const range = presetToRange("30d");

  const [
    clientCount,
    activeClientCount,
    accountCount,
    googleCount,
    metaCount,
    demoCount,
    realCount,
    summary,
    recentLogs,
    healthAggregate,
    slaMonitor,
    revenueSummary,
    royalties,
  ] = await Promise.all([
    prisma.client.count(),
    prisma.client.count({ where: { status: "ACTIVE" } }),
    prisma.adAccount.count(),
    prisma.adAccount.count({ where: { platform: "GOOGLE_ADS" } }),
    prisma.adAccount.count({ where: { platform: "META_ADS" } }),
    prisma.adAccount.count({ where: { dataSource: "DEMO" } }),
    prisma.adAccount.count({ where: { dataSource: "REAL" } }),
    getMetricsSummary({ clientId: null, isAggregate: true }, range, "all"),
    prisma.syncLog.findMany({
      orderBy: { startedAt: "desc" },
      take: 5,
      include: { adAccount: { select: { name: true, client: { select: { name: true } } } } },
    }),
    getHealthScoreAggregate(),
    getSlaMonitor(),
    getSummaryWithComparison({ clientId: null, isAggregate: true }, range, "all"),
    listRoyalties(),
  ]);

  const latestSnap = await prisma.healthSnapshot.findFirst({ orderBy: { day: "desc" }, select: { day: true } });
  const snaps = latestSnap
    ? await prisma.healthSnapshot.findMany({
        where: { day: latestSnap.day },
        include: { client: { select: { id: true, name: true } } },
      })
    : [];
  const snapCounts = snaps.reduce<Record<string, number>>((acc, s) => ({ ...acc, [s.classification]: (acc[s.classification] ?? 0) + 1 }), {});
  const needAttention = snaps
    .filter((s) => s.classification === "CRITICO" || s.classification === "ATENCAO")
    .sort((a, b) => (a.score ?? 100) - (b.score ?? 100))
    .slice(0, 8);

  const [ekyte, squadRows] = await Promise.all([
    getEkyteSnapshot(),
    prisma.squad.findMany({ include: { _count: { select: { members: true, clients: true } } }, orderBy: { name: "asc" } }),
  ]);
  const overdueTasks = ekyte.tasks.filter(isEkyteOverdue).length;

  const errorLogs = recentLogs.filter((l) => l.status === "ERROR");
  const clientsAtRisk = healthAggregate.atRisk + healthAggregate.imminentRisk;
  const slaAlertCount = (slaMonitor?.urgent.length ?? 0) + (slaMonitor?.attention.length ?? 0);

  // MRR = soma do "Fee mensal" do Health Score de todos os clientes — o que entra em caixa pra
  // Lima Soares todo mês. Royalties ativos (ex: 20% pra V4 Company) somam antes de descontar, já
  // que mais de uma obrigação pode coexistir.
  const mrrBrl = healthAggregate.totalFeeBrl;
  const royaltyPct = royalties.filter((r) => r.active).reduce((sum, r) => sum + r.percentage, 0);
  const mrrNetBrl = mrrBrl * (1 - royaltyPct / 100);

  return (
    <div>
      <PageHeader title="Visão Geral" description="Painel administrativo da agência" />

      <div className="flex flex-wrap gap-4">
        <StatCard className="min-w-[170px] flex-1 basis-56" label="Clientes ativos" value={activeClientCount} icon={Users} formatter={(v) => `${v} / ${clientCount}`} />
        <Link href="/clientes?tab=health-score" className="min-w-[170px] flex-1 basis-56">
          <StatCard
            label="Clientes em risco"
            value={clientsAtRisk}
            icon={ShieldAlert}
            formatter={(v) => `${v} (${healthAggregate.imminentRisk} iminente)`}
          />
        </Link>
        <StatCard className="min-w-[170px] flex-1 basis-56" label="Fee mensal da carteira" value={mrrBrl} icon={Landmark} formatter={formatBRL} />
        <Link href="/controle-sla" className="min-w-[170px] flex-1 basis-56">
          <StatCard
            label="Alertas de atendimento"
            value={slaAlertCount}
            icon={Siren}
            formatter={(v) => (slaMonitor ? `${v} (${slaMonitor.urgent.length} urgente)` : "Sem conexão")}
          />
        </Link>
        <Link href="/ekyte" className="min-w-[170px] flex-1 basis-56">
          <StatCard label="Entregas atrasadas" value={overdueTasks} icon={ListChecks} formatter={(v) => String(v)} invertDelta />
        </Link>
      </div>

      <Card className="mt-6">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Saúde calculada da carteira</CardTitle>
          {viewer.role === "ADMIN" && <HealthSnapshotButton />}
        </CardHeader>
        <CardContent>
          {!latestSnap ? (
            <EmptyState message="Ainda não há snapshots. Use “Recalcular agora” para gerar a primeira leitura." className="py-4" />
          ) : (
            <div className="flex flex-col gap-4">
              <p className="text-xs text-muted">Leitura de {formatDateOnly(latestSnap.day)} · {snaps.length} cliente(s) ativos. A avaliação manual do Account continua em Clientes.</p>
              <div className="flex flex-wrap gap-2">
                {(["SAUDAVEL", "ATENCAO", "CRITICO", "INSUFICIENTE", "IMPLANTACAO"] as Classification[]).map((c) => (
                  <Badge key={c} variant={c === "SAUDAVEL" ? "positive" : c === "ATENCAO" ? "warning" : c === "CRITICO" ? "negative" : "default"}>
                    {CLASSIFICATION_LABEL[c]}: {snapCounts[c] ?? 0}
                  </Badge>
                ))}
              </div>
              {needAttention.length > 0 && (
                <ul className="divide-y divide-border text-sm">
                  {needAttention.map((s) => (
                    <li key={s.id} className="flex items-center justify-between py-2">
                      <Link href={`/clientes/${s.client.id}`} className="font-medium hover:text-primary hover:underline">{s.client.name}</Link>
                      <span className="text-xs text-muted">
                        {s.score ?? "—"} · {CLASSIFICATION_LABEL[s.classification as Classification]}{s.partial ? " (parcial)" : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {squadRows.length > 0 && (
        <Card className="mt-6">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><UsersRound className="size-4 text-muted" /> Squads</CardTitle>
            <Link href="/equipes?tab=alocacao" className="text-xs font-medium text-primary hover:underline">Ver alocação</Link>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {squadRows.map((sq) => (
              <Link key={sq.id} href={`/equipes/squad/${sq.id}`} className="rounded-lg bg-surface-2 p-3 text-sm hover:bg-surface-2/70">
                <div className="font-medium">{sq.name}</div>
                <div className="mt-1 text-xs text-muted">
                  {sq._count.members} pessoa(s) · {sq._count.clients} cliente(s)
                  {sq._count.members > 0 ? ` · ${(sq._count.clients / sq._count.members).toFixed(1)} por pessoa` : ""}
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      <h2 className="mb-3 mt-8 text-xs font-semibold uppercase tracking-wide text-muted-2">Performance e integrações</h2>
      <div className="flex flex-wrap gap-4">
        <StatCard className="min-w-[170px] flex-1 basis-56" label="Investimento total (30d)" value={summary.costBrl} icon={Wallet} formatter={formatBRL} />
        <StatCard
          className="min-w-[170px] flex-1 basis-56"
          label="Faturamento lançado (30d)"
          value={revenueSummary.current.revenueBrl}
          previousValue={revenueSummary.previous.revenueBrl}
          icon={Receipt}
          formatter={formatBRL}
        />
        <StatCard
          className="min-w-[170px] flex-1 basis-56"
          label="Fee líquido (pós-royalties)"
          value={mrrNetBrl}
          icon={PiggyBank}
          formatter={(v) => `${formatBRL(v)}${royaltyPct > 0 ? ` (-${royaltyPct.toFixed(0)}%)` : ""}`}
        />
        <StatCard className="min-w-[170px] flex-1 basis-56" label="Contas conectadas" value={accountCount} icon={Building2} formatter={(v) => `${v} (${googleCount} Google · ${metaCount} Meta)`} />
        <StatCard className="min-w-[170px] flex-1 basis-56" label="Contas com dado real" value={realCount} icon={RefreshCw} formatter={(v) => `${v} / ${accountCount} (${demoCount} demo)`} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Sincronizações recentes</CardTitle>
            <Link href="/sincronizacoes" className="text-xs font-medium text-primary hover:underline">Ver todas</Link>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {recentLogs.length === 0 && <EmptyState message="Nenhuma sincronização registrada ainda." className="py-4" />}
            {recentLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between border-b border-border pb-3 text-sm last:border-0 last:pb-0">
                <div>
                  <p className="font-medium">{log.adAccount.name}</p>
                  <p className="text-xs text-muted">{log.adAccount.client.name} · {formatDate(log.startedAt)}</p>
                </div>
                <Badge variant={log.status === "SUCCESS" ? "positive" : log.status === "ERROR" ? "negative" : "warning"}>
                  {log.status === "SUCCESS" ? "Sucesso" : log.status === "ERROR" ? "Erro" : "Em execução"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-warning" /> Pendências
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            {errorLogs.length === 0 ? (
              <EmptyState message="Nenhuma pendência de sincronização no momento." className="py-4" />
            ) : (
              errorLogs.map((log) => (
                <div key={log.id} className="rounded-lg bg-negative-soft p-3 text-xs text-negative">
                  <p className="font-medium">{log.adAccount.name} ({log.adAccount.client.name})</p>
                  <p className="mt-1">{log.errorMessage}</p>
                </div>
              ))
            )}
            {demoCount > 0 && (
              <div className="rounded-lg bg-info-soft p-3 text-xs text-info">
                {demoCount} conta(s) ainda usando dados de demonstração. Conecte contas reais em{" "}
                <Link href="/contas" className="underline">Contas</Link>.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
