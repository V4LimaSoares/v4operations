"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Trash2, Crown } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { RecurringExpenseDialog, type EditableRecurringExpense } from "@/components/financeiro/recurring-expense-dialog";
import { formatBRL, formatDateOnly } from "@/lib/utils";

export type ProlaboreRow = EditableRecurringExpense & {
  teamMember: { id: string; name: string; role: string } | null;
};

export function ProlaboreTable({ rows, teamMembers }: { rows: ProlaboreRow[]; teamMembers: { id: string; name: string; active: boolean }[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  function remove(id: string) {
    startTransition(async () => {
      const res = await fetch(`/api/admin/financeiro/recorrentes/${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Não foi possível excluir.");
        return;
      }
      toast.success("Excluído.");
      setConfirmingId(null);
      router.refresh();
    });
  }

  if (rows.length === 0) {
    return <EmptyState message="Nenhum colaborador com fixo/pró-labore cadastrado." className="py-6" />;
  }

  // Columns nobody has data in yet (e.g. no one has been let go) stay hidden instead of
  // rendering a full column of dashes — they reappear on their own the moment a row sets that
  // field, since this checks the actual rows rather than a fixed column list.
  const showTermination = rows.some((r) => r.terminationDate != null);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Função</TableHead>
          <TableHead className="text-right">Fixo/Pró-Labore</TableHead>
          <TableHead className="text-right">Porcentagem</TableHead>
          <TableHead className="text-right">Monetização/Indicação</TableHead>
          <TableHead>Data de Contratação</TableHead>
          {showTermination && <TableHead>Data de Desligamento</TableHead>}
          <TableHead>Status</TableHead>
          <TableHead>Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="font-medium">
              <div className="flex items-center gap-2">
                {row.teamMember?.name ?? row.name}
                {row.isPartner && (
                  <Badge variant="warning" className="gap-1">
                    <Crown className="size-3" /> Sócio
                  </Badge>
                )}
              </div>
            </TableCell>
            <TableCell className="text-muted">{row.teamMember?.role ?? "—"}</TableCell>
            <TableCell className="text-right tabular-nums">{formatBRL(row.amountBrl)}</TableCell>
            <TableCell className="text-right tabular-nums">{row.percentage != null ? `${row.percentage}%` : "—"}</TableCell>
            <TableCell className="text-right tabular-nums">{row.referralPercentage != null ? `${row.referralPercentage}%` : "—"}</TableCell>
            <TableCell>{row.hireDate ? formatDateOnly(row.hireDate) : "—"}</TableCell>
            {showTermination && <TableCell>{row.terminationDate ? formatDateOnly(row.terminationDate) : "—"}</TableCell>}
            <TableCell>
              <Badge variant={row.active ? "positive" : "outline"}>{row.active ? "Ativo" : "Inativo"}</Badge>
            </TableCell>
            <TableCell>
              {confirmingId === row.id ? (
                <div className="flex items-center gap-1.5">
                  <Button size="sm" variant="destructive" onClick={() => remove(row.id)} disabled={pending}>
                    Confirmar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setConfirmingId(null)}>
                    Cancelar
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <RecurringExpenseDialog kind="PROLABORE" expense={row} teamMembers={teamMembers} />
                  <Button variant="ghost" size="icon" onClick={() => setConfirmingId(row.id)} className="text-negative">
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
