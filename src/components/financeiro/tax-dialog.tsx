"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";

export function TaxDialog({ month, year }: { month: number; year: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [amountBrl, setAmountBrl] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/financeiro/impostos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, amountBrl: Number(amountBrl), month, year }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Não foi possível salvar.");
        return;
      }
      toast.success("Imposto registrado.");
      setOpen(false);
      setName("");
      setAmountBrl("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" /> Novo imposto
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo imposto pago</DialogTitle>
          <DialogDescription>Registrado no mês/ano selecionado no filtro.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tax-name">Nome</Label>
            <Input id="tax-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: DAS Simples Nacional" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tax-amount">Valor (R$)</Label>
            <Input id="tax-amount" type="number" step="0.01" min="0" required value={amountBrl} onChange={(e) => setAmountBrl(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              Registrar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
