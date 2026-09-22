"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Check, X, Trash2 } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatBRL, formatDate } from "@/lib/utils";

export type ExpenseInstanceRow = {
  id: string;
  description: string;
  category: string | null;
  amountBrl: number;
  dueDate: string;
  status: "PENDING" | "PAID";
};

function statusInfo(row: ExpenseInstanceRow): { label: string; variant: "positive" | "negative" | "default" } {
  if (row.status === "PAID") return { label: "Pago", variant: "positive" };
  if (new Date(row.dueDate) < new Date()) return { label: "Vencido", variant: "negative" };
  return { label: "Pendente", variant: "default" };
}

export function ExpenseInstanceTable({ rows }: { rows: ExpenseInstanceRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function toggleStatus(row: ExpenseInstanceRow) {
    startTransition(async () => {
      const res = await fetch(`/api/admin/financeiro/instancias/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: row.status === "PAID" ? "PENDING" : "PAID" }),
      });
      if (!res.ok) {
        toast.error("Não foi possível atualizar.");
        return;
      }
      router.refresh();
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const res = await fetch(`/api/admin/financeiro/instancias/${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Não foi possível excluir.");
        return;
      }
      toast.success("Excluído.");
      router.refresh();
    });
  }

  if (rows.length === 0) {
    return <EmptyState message="Nenhum lançamento neste mês." className="py-6" />;
  }

  // Same reasoning as ProlaboreTable's Data de Desligamento: don't render a column of nothing
  // but dashes — the Pró-labore instances this table shares with Contas a Pagar don't set a
  // category, so it stayed empty for 11/11 rows.
  const showCategory = rows.some((r) => r.category != null);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Descrição</TableHead>
          {showCategory && <TableHead>Categoria</TableHead>}
          <TableHead className="text-right">Valor</TableHead>
          <TableHead>Vencimento</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => {
          const info = statusInfo(row);
          return (
            <TableRow key={row.id}>
              <TableCell className="font-medium">{row.description}</TableCell>
              {showCategory && <TableCell className="text-muted">{row.category ?? "—"}</TableCell>}
              <TableCell className="text-right tabular-nums">{formatBRL(row.amountBrl)}</TableCell>
              <TableCell className={info.variant === "negative" ? "text-negative" : undefined}>{formatDate(row.dueDate)}</TableCell>
              <TableCell>
                <Badge variant={info.variant}>{info.label}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={pending}
                    onClick={() => toggleStatus(row)}
                    className={row.status === "PAID" ? "text-muted-2" : "text-positive"}
                    aria-label={row.status === "PAID" ? "Marcar como pendente" : "Marcar como pago"}
                  >
                    {row.status === "PAID" ? <X className="size-4" /> : <Check className="size-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" disabled={pending} onClick={() => remove(row.id)} className="text-negative">
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
