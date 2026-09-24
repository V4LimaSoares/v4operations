"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PortfolioItemDialog, type EditablePortfolioItem } from "@/components/admin/portfolio-item-dialog";
import { formatBRL } from "@/lib/utils";

export function PortfolioCategoryTable({ items, isAdmin }: { items: EditablePortfolioItem[]; isAdmin: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  async function remove(id: string) {
    setPending(true);
    try {
      const res = await fetch(`/api/admin/portfolio/${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Não foi possível excluir.");
        return;
      }
      toast.success("Excluído.");
      setConfirmingId(null);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Serviço</TableHead>
              <TableHead>Variação</TableHead>
              <TableHead className="text-right">Valor base</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Status</TableHead>
              {isAdmin && <TableHead className="w-10" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.service}</TableCell>
                <TableCell className="text-muted">{item.variation ?? "—"}</TableCell>
                <TableCell className="text-right tabular-nums">{item.valueBrl != null ? formatBRL(item.valueBrl) : "A definir"}</TableCell>
                <TableCell className="max-w-xs text-xs text-muted">{item.description ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={item.status === "Ativo" ? "positive" : "outline"}>{item.status}</Badge>
                </TableCell>
                {isAdmin && (
                  <TableCell>
                    {confirmingId === item.id ? (
                      <div className="flex items-center gap-1.5">
                        <Button size="sm" variant="destructive" disabled={pending} onClick={() => remove(item.id)}>
                          Confirmar
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setConfirmingId(null)}>
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <PortfolioItemDialog item={item} />
                        <Button variant="ghost" size="icon" className="text-negative" onClick={() => setConfirmingId(item.id)}>
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
