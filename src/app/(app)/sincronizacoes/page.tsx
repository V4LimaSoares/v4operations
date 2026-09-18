import { requireStaffModule } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { SyncButton } from "@/components/admin/sync-button";
import { PlatformBadge, DataSourceBadge } from "@/components/dashboard/badges";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import type { SyncStatus } from "@prisma/client";

const STATUS_META: Record<SyncStatus, { label: string; variant: "positive" | "negative" | "warning" }> = {
  SUCCESS: { label: "Sucesso", variant: "positive" },
  ERROR: { label: "Erro", variant: "negative" },
  RUNNING: { label: "Em execução", variant: "warning" },
};

export default async function SincronizacoesPage() {
  await requireStaffModule("sincronizacoes");

  const [accounts, logs] = await Promise.all([
    prisma.adAccount.findMany({
      include: { client: { select: { name: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.syncLog.findMany({
      include: { adAccount: { select: { name: true, client: { select: { name: true } } } }, triggeredBy: { select: { name: true } } },
      orderBy: { startedAt: "desc" },
      take: 100,
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Sincronizações"
        description="Status de sincronização das contas e histórico de execuções"
      />

      <Card>
        <CardHeader><CardTitle>Contas conectadas</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Conta</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Plataforma</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Última sincronização</TableHead>
                <TableHead className="w-32" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.name}</TableCell>
                  <TableCell className="text-muted">{a.client.name}</TableCell>
                  <TableCell><PlatformBadge platform={a.platform} /></TableCell>
                  <TableCell><DataSourceBadge dataSource={a.dataSource} /></TableCell>
                  <TableCell className="text-xs text-muted">{a.lastSyncAt ? formatDate(a.lastSyncAt) : "Nunca"}</TableCell>
                  <TableCell><SyncButton adAccountId={a.id} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader><CardTitle>Logs de sincronização</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Conta</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Registros</TableHead>
                <TableHead>Disparado por</TableHead>
                <TableHead>Detalhes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted">
                    Nenhuma sincronização registrada ainda.
                  </TableCell>
                </TableRow>
              )}
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs">{formatDate(log.startedAt)}</TableCell>
                  <TableCell className="text-sm">{log.adAccount.name}</TableCell>
                  <TableCell className="text-muted">{log.adAccount.client.name}</TableCell>
                  <TableCell><Badge variant={STATUS_META[log.status].variant}>{STATUS_META[log.status].label}</Badge></TableCell>
                  <TableCell className="text-right tabular-nums">{log.recordsSynced ?? "—"}</TableCell>
                  <TableCell className="text-xs text-muted">{log.triggeredBy?.name ?? log.triggeredByLabel ?? "—"}</TableCell>
                  <TableCell className="max-w-xs truncate text-xs text-muted" title={log.errorMessage ?? undefined}>
                    {log.errorMessage ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
