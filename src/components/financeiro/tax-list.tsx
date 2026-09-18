"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatBRL, formatDate } from "@/lib/utils";

export type TaxRow = { id: string; name: string; amountBrl: number; paidAt: string | null };

export function TaxList({ taxes }: { taxes: TaxRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function remove(id: string) {
    startTransition(async () => {
      const res = await fetch(`/api/admin/financeiro/impostos/${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Não foi possível excluir.");
        return;
      }
      toast.success("Excluído.");
      router.refresh();
    });
  }

  if (taxes.length === 0) {
    return <EmptyState message="Nenhum imposto registrado." className="py-6" />;
  }

  return (
    <div className="flex flex-col gap-2">
      {taxes.map((tax) => (
        <div key={tax.id} className="flex items-center justify-between rounded-xl border border-border/60 bg-surface-2/40 p-3">
          <div>
            <span className="text-sm font-semibold">{tax.name}</span>
            <p className="mt-0.5 text-xs text-muted">
              {formatBRL(tax.amountBrl)} {tax.paidAt && `· pago em ${formatDate(tax.paidAt)}`}
            </p>
          </div>
          <Button variant="ghost" size="icon" disabled={pending} onClick={() => remove(tax.id)} className="text-negative">
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
