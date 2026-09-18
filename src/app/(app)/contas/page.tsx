import { requireStaffModule } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { listUnmatchedRealAccounts } from "@/lib/data/ad-accounts";
import { PageHeader } from "@/components/layout/page-header";
import { NewAccountDialog } from "@/components/admin/new-account-dialog";
import { UnmatchedAccountsPanel } from "@/components/admin/unmatched-accounts-panel";
import { SyncButton } from "@/components/admin/sync-button";
import { PlatformBadge, DataSourceBadge } from "@/components/dashboard/badges";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";

export default async function ContasPage() {
  await requireStaffModule("contas");

  const [accounts, clients, unmatched] = await Promise.all([
    prisma.adAccount.findMany({
      include: { client: { select: { id: true, name: true, company: true } } },
      orderBy: { connectedAt: "desc" },
    }),
    prisma.client.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, company: true } }),
    listUnmatchedRealAccounts(),
  ]);

  return (
    <div>
      <PageHeader
        title="Contas"
        description="Contas de Google Ads e Meta Ads conectadas aos clientes"
        actions={<NewAccountDialog clients={clients} />}
      />

      <UnmatchedAccountsPanel accounts={unmatched} clients={clients} />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Conta</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Plataforma</TableHead>
                <TableHead>ID externo</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Última sincronização</TableHead>
                <TableHead className="w-32" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted">
                    Nenhuma conta conectada ainda.
                  </TableCell>
                </TableRow>
              )}
              {accounts.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.name}</TableCell>
                  <TableCell className="text-muted">{a.client.name}</TableCell>
                  <TableCell><PlatformBadge platform={a.platform} /></TableCell>
                  <TableCell className="font-mono text-xs text-muted">{a.externalId}</TableCell>
                  <TableCell><DataSourceBadge dataSource={a.dataSource} /></TableCell>
                  <TableCell className="text-xs text-muted">{a.lastSyncAt ? formatDate(a.lastSyncAt) : "Nunca"}</TableCell>
                  <TableCell><SyncButton adAccountId={a.id} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
