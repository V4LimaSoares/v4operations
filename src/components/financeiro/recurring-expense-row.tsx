"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Pencil, Trash2, Power } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RecurringExpenseDialog, type EditableRecurringExpense } from "@/components/financeiro/recurring-expense-dialog";
import { formatBRL } from "@/lib/utils";

export type RecurringExpenseRowData = EditableRecurringExpense & {
  active: boolean;
  teamMember: { id: string; name: string } | null;
};

export function RecurringExpenseRow({
  kind,
  expense,
  teamMembers,
}: {
  kind: "BILL" | "PROLABORE";
  expense: RecurringExpenseRowData;
  teamMembers: { id: string; name: string; active: boolean }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);

  function toggleActive() {
    startTransition(async () => {
      const res = await fetch(`/api/admin/financeiro/recorrentes/${expense.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !expense.active }),
      });
      if (!res.ok) {
        toast.error("Não foi possível atualizar.");
        return;
      }
      router.refresh();
    });
  }

  function remove() {
    startTransition(async () => {
      const res = await fetch(`/api/admin/financeiro/recorrentes/${expense.id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Não foi possível excluir.");
        return;
      }
      toast.success("Excluído.");
      router.refresh();
    });
  }

  return (
    <div className="flex items-center justify-between rounded-xl border border-border/60 bg-surface-2/40 p-3">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{expense.name}</span>
          {kind === "BILL" && expense.category && <Badge variant="outline">{expense.category}</Badge>}
          {kind === "PROLABORE" && expense.teamMember && <Badge variant="outline">{expense.teamMember.name}</Badge>}
        </div>
        <p className="mt-0.5 text-xs text-muted">
          {formatBRL(expense.amountBrl)} · Todo dia {expense.dayOfMonth}
        </p>
      </div>
      <div className="flex items-center gap-1">
        {confirming ? (
          <>
            <span className="text-xs text-muted">Excluir?</span>
            <Button size="sm" variant="destructive" onClick={remove} disabled={pending}>
              Confirmar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
              Cancelar
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" size="icon" onClick={() => setEditing(true)} disabled={pending}>
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleActive}
              disabled={pending}
              className={expense.active ? "text-positive" : "text-muted-2"}
              aria-label={expense.active ? "Desativar" : "Ativar"}
            >
              <Power className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setConfirming(true)} disabled={pending} className="text-negative">
              <Trash2 className="size-4" />
            </Button>
          </>
        )}
      </div>
      <RecurringExpenseDialog kind={kind} expense={expense} teamMembers={teamMembers} trigger={null} open={editing} onOpenChange={setEditing} />
    </div>
  );
}
