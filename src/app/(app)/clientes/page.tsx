import Link from "next/link";
import { requireAdmin } from "@/lib/session";
import { presetToRange } from "@/lib/data/metrics";
import { listClientsWithStats } from "@/lib/data/clients";
import { PageHeader } from "@/components/layout/page-header";
import { NewClientDialog } from "@/components/admin/new-client-dialog";
import { ClientRowActions } from "@/components/admin/client-row-actions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatBRL, formatNumber } from "@/lib/utils";

const STATUS_LABEL: Record<string, { label: string; variant: "positive" | "warning" | "default" }> = {
  ACTIVE: { label: "Ativo", variant: "positive" },
  PAUSED: { label: "Pausado", variant: "warning" },
  INACTIVE: { label: "Inativo", variant: "default" },
};

export default async function ClientesPage() {
  await requireAdmin();
  const range = presetToRange("30d");
  const clients = await listClientsWithStats(range);

  return (
    <div>
      <PageHeader title="Clientes" description="Todos os clientes cadastrados na agência" actions={<NewClientDialog />} />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Conta Google</TableHead>
                <TableHead>Conta Meta</TableHead>
                <TableHead className="text-right">Investimento (30d)</TableHead>
                <TableHead className="text-right">Conversões</TableHead>
                <TableHead className="text-right">Faturamento</TableHead>
                <TableHead className="text-right">ROAS</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="py-10 text-center text-muted">
                    Nenhum cliente cadastrado ainda.
                  </TableCell>
                </TableRow>
              )}
              {clients.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link href={`/clientes/${c.id}`} className="font-medium text-foreground hover:text-primary hover:underline">
                      {c.name}
                    </Link>
                    <p className="text-xs text-muted">{c.company}</p>
                  </TableCell>
                  <TableCell className="text-xs text-muted">
                    {c.googleAccounts.length > 0 ? c.googleAccounts.map((a) => a.name).join(", ") : "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted">
                    {c.metaAccounts.length > 0 ? c.metaAccounts.map((a) => a.name).join(", ") : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatBRL(c.costBrl)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatNumber(c.conversions, 1)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatBRL(c.revenueBrl)}</TableCell>
                  <TableCell className="text-right tabular-nums">{c.roas.toFixed(2)}x</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_LABEL[c.status].variant}>{STATUS_LABEL[c.status].label}</Badge>
                  </TableCell>
                  <TableCell>
                    <ClientRowActions id={c.id} status={c.status} />
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
