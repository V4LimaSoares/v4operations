"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PORTFOLIO_CATEGORY_ORDER, PORTFOLIO_CATEGORY_LABEL } from "@/lib/portfolio-constants";
import type { PortfolioCategory } from "@prisma/client";

export type EditablePortfolioItem = {
  id: string;
  category: PortfolioCategory;
  service: string;
  variation: string | null;
  valueBrl: number | null;
  description: string | null;
  status: string;
  notes: string | null;
};

/** Create when `item` is omitted, edit when provided — same convention as RecurringExpenseDialog. */
export function PortfolioItemDialog({ item }: { item?: EditablePortfolioItem }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState<PortfolioCategory>(item?.category ?? "TER");
  const [service, setService] = useState(item?.service ?? "");
  const [variation, setVariation] = useState(item?.variation ?? "");
  const [valueBrl, setValueBrl] = useState(item?.valueBrl != null ? String(item.valueBrl) : "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [status, setStatus] = useState(item?.status ?? "Ativo");
  const [notes, setNotes] = useState(item?.notes ?? "");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        category,
        service,
        variation: variation.trim() || null,
        valueBrl: valueBrl.trim() ? Number(valueBrl) : null,
        description: description.trim() || null,
        status,
        notes: notes.trim() || null,
      };
      const res = await fetch(item ? `/api/admin/portfolio/${item.id}` : "/api/admin/portfolio", {
        method: item ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Não foi possível salvar.");
        return;
      }
      toast.success(item ? "Item atualizado." : "Item criado.");
      setOpen(false);
      if (!item) {
        setService("");
        setVariation("");
        setValueBrl("");
        setDescription("");
        setNotes("");
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {item ? (
          <Button variant="ghost" size="icon" aria-label="Editar item">
            <Pencil className="size-4" />
          </Button>
        ) : (
          <Button>
            <Plus className="size-4" /> Novo item
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle>{item ? "Editar item do portfólio" : "Novo item do portfólio"}</DialogTitle>
          <DialogDescription>Categoria, serviço, variação, valor base e descrição do catálogo.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pf-category">Categoria</Label>
              <Select id="pf-category" value={category} onChange={(e) => setCategory(e.target.value as PortfolioCategory)}>
                {PORTFOLIO_CATEGORY_ORDER.map((c) => (
                  <option key={c} value={c}>
                    {PORTFOLIO_CATEGORY_LABEL[c]}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pf-status">Status</Label>
              <Select id="pf-status" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="Ativo">Ativo</option>
                <option value="Inativo">Inativo</option>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pf-service">Serviço</Label>
            <Input id="pf-service" required value={service} onChange={(e) => setService(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pf-variation">Variação</Label>
              <Input id="pf-variation" placeholder="— (sem variação)" value={variation} onChange={(e) => setVariation(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pf-value">Valor base (R$)</Label>
              <Input id="pf-value" type="number" step="0.01" min="0" placeholder="A definir" value={valueBrl} onChange={(e) => setValueBrl(e.target.value)} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pf-description">Descrição</Label>
            <Textarea id="pf-description" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pf-notes">Observações</Label>
            <Textarea id="pf-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex: inconsistência de nomenclatura, nota interna…" />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              {item ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
