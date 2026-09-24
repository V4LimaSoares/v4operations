import Link from "next/link";
import { Users, Building2, Wallet, RefreshCw, AlertTriangle, ShieldAlert, Siren, Receipt, Landmark, PiggyBank } from "lucide-react";
import { requireStaffModule } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { presetToRange, getMetricsSummary, getSummaryWithComparison } from "@/lib/data/metrics";
import { getHealthScoreAggregate } from "@/lib/data/health-score";
import { getSlaMonitor } from "@/lib/data/sla";
import { listRoyalties } from "@/lib/data/financeiro";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { formatBRL, formatNumber, formatDate } from "@/lib/utils";

export default async function AdminOverviewPage() {
  await requireStaffModule("admin_overview");
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

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Clientes ativos" value={activeClientCount} icon={Users} formatter={(v) => `${v} / ${clientCount}`} />
        <StatCard label="Contas conectadas" value={accountCount} icon={Building2} formatter={(v) => `${v} (${googleCount} Google · ${metaCount} Meta)`} />
        <StatCard label="Investimento total (30d)" value={summary.costBrl} icon={Wallet} formatter={formatBRL} />
        <StatCard label="Contas com dado real" value={realCount} icon={RefreshCw} formatter={(v) => `${v} / ${accountCount} (${demoCount} demo)`} />
      </div>

      <div className="mt-4 flex flex-wrap gap-4">
        <Link href="/clientes?tab=health-score" className="min-w-[170px] flex-1 basis-56">
          <StatCard
            label="Clientes em risco"
            value={clientsAtRisk}
            icon={ShieldAlert}
            formatter={(v) => `${v} (${healthAggregate.imminentRisk} iminente)`}
          />
        </Link>
        <Link href="/controle-sla" className="min-w-[170px] flex-1 basis-56">
          <StatCard
            label="Alertas de SLA abertos"
            value={slaAlertCount}
            icon={Siren}
            formatter={(v) => (slaMonitor ? `${v} (${slaMonitor.urgent.length} urgente)` : "Sem conexão")}
          />
        </Link>
        <StatCard
          className="min-w-[170px] flex-1 basis-56"
          label="Faturamento (30d)"
          value={revenueSummary.current.revenueBrl}
          previousValue={revenueSummary.previous.revenueBrl}
          icon={Receipt}
          formatter={formatBRL}
        />
        <StatCard className="min-w-[170px] flex-1 basis-56" label="MRR Lima Soares" value={mrrBrl} icon={Landmark} formatter={formatBRL} />
        <StatCard
          className="min-w-[170px] flex-1 basis-56"
          label="MRR líquido (pós-royalties)"
          value={mrrNetBrl}
          icon={PiggyBank}
          formatter={(v) => `${formatBRL(v)}${royaltyPct > 0 ? ` (-${royaltyPct.toFixed(0)}%)` : ""}`}
        />
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
