"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { RoyaltyDialog, type EditableRoyalty } from "@/components/financeiro/royalty-dialog";

export function RoyaltyTable({ royalties }: { royalties: (EditableRoyalty & { active: boolean })[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  function remove(id: string) {
    startTransition(async () => {
      const res = await fetch(`/api/admin/financeiro/royalties/${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Não foi possível excluir.");
        return;
      }
      toast.success("Excluído.");
      setConfirmingId(null);
      router.refresh();
    });
  }

  if (royalties.length === 0) {
    return <EmptyState message="Nenhum royalty configurado." className="py-6" />;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Porcentagem</TableHead>
          <TableHead>Descrição</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {royalties.map((r) => (
          <TableRow key={r.id}>
            <TableCell className="font-medium">{r.name}</TableCell>
            <TableCell className="tabular-nums">{r.percentage}%</TableCell>
            <TableCell className="text-muted">{r.description ?? "—"}</TableCell>
            <TableCell>
              <Badge variant={r.active ? "positive" : "outline"}>{r.active ? "Ativo" : "Inativo"}</Badge>
            </TableCell>
            <TableCell>
              {confirmingId === r.id ? (
                <div className="flex items-center gap-1.5">
                  <Button size="sm" variant="destructive" onClick={() => remove(r.id)} disabled={pending}>
                    Confirmar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setConfirmingId(null)}>
                    Cancelar
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <RoyaltyDialog royalty={r} />
                  <Button variant="ghost" size="icon" onClick={() => setConfirmingId(r.id)} className="text-negative">
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
