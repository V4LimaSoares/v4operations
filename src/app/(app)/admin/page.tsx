import Link from "next/link";
import { Users, Building2, Wallet, RefreshCw, AlertTriangle } from "lucide-react";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { presetToRange, getMetricsSummary } from "@/lib/data/metrics";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatBRL, formatNumber, formatDate } from "@/lib/utils";

export default async function AdminOverviewPage() {
  await requireAdmin();
  const range = presetToRange("30d");

  const [clientCount, activeClientCount, accountCount, googleCount, metaCount, demoCount, realCount, summary, recentLogs] =
    await Promise.all([
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
    ]);

  const errorLogs = recentLogs.filter((l) => l.status === "ERROR");

  return (
    <div>
      <PageHeader title="Visão Geral" description="Painel administrativo da agência" />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Clientes ativos" value={activeClientCount} icon={Users} formatter={(v) => `${v} / ${clientCount}`} />
        <StatCard label="Contas conectadas" value={accountCount} icon={Building2} formatter={(v) => `${v} (${googleCount} Google · ${metaCount} Meta)`} />
        <StatCard label="Investimento total (30d)" value={summary.costBrl} icon={Wallet} formatter={formatBRL} />
        <StatCard label="Contas com dado real" value={realCount} icon={RefreshCw} formatter={(v) => `${v} / ${accountCount} (${demoCount} demo)`} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Sincronizações recentes</CardTitle>
            <Link href="/sincronizacoes" className="text-xs font-medium text-primary hover:underline">Ver todas</Link>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {recentLogs.length === 0 && <p className="text-sm text-muted">Nenhuma sincronização registrada ainda.</p>}
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
              <p className="text-muted">Nenhuma pendência de sincronização no momento.</p>
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
