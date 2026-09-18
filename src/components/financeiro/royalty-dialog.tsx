"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";

export type EditableRoyalty = { id: string; name: string; percentage: number; description: string | null };

export function RoyaltyDialog({
  royalty,
  trigger,
  open: openProp,
  onOpenChange,
}: {
  royalty?: EditableRoyalty;
  trigger?: React.ReactNode | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const router = useRouter();
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const setOpen = onOpenChange ?? setOpenState;
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(royalty?.name ?? "");
  const [percentage, setPercentage] = useState(royalty?.percentage != null ? String(royalty.percentage) : "");
  const [description, setDescription] = useState(royalty?.description ?? "");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(royalty ? `/api/admin/financeiro/royalties/${royalty.id}` : "/api/admin/financeiro/royalties", {
        method: royalty ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, percentage: Number(percentage), description: description || null }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Não foi possível salvar.");
        return;
      }
      toast.success(royalty ? "Atualizado." : "Royalty criado.");
      setOpen(false);
      if (!royalty) {
        setName("");
        setPercentage("");
        setDescription("");
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger !== null && (
        <DialogTrigger asChild>
          {trigger ?? (royalty ? (
            <Button variant="ghost" size="icon">
              <Pencil className="size-4" />
            </Button>
          ) : (
            <Button>
              <Plus className="size-4" /> Adicionar royalty
            </Button>
          ))}
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{royalty ? "Editar royalty" : "Novo royalty"}</DialogTitle>
          <DialogDescription>Percentual configurado, sem lançamento mensal automático.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="royalty-name">Nome</Label>
            <Input id="royalty-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: V4 Company" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="royalty-pct">Porcentagem (%)</Label>
            <Input id="royalty-pct" type="number" step="0.1" min="0" max="100" required value={percentage} onChange={(e) => setPercentage(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="royalty-desc">Descrição (opcional)</Label>
            <Textarea id="royalty-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Ex: Descontados na fonte" />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              {royalty ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
