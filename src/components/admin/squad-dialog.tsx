"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, Pencil } from "lucide-react";
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

export type EditableSquad = { id: string; name: string; logoUrl?: string | null };

/** Create when `squad` is omitted, edit when provided — same form either way. Members and
 *  clients are managed on the squad's own detail page, not here (mirrors NewClientDialog /
 *  TeamMemberDialog: the creation dialog only sets the base record). */
export function SquadDialog({
  squad,
  trigger,
  open: openProp,
  onOpenChange,
}: {
  squad?: EditableSquad;
  /** Omit to get the dialog's own trigger button; pass `null` to render no trigger at all
   *  (fully controlled via `open`/`onOpenChange` — e.g. from a card's dropdown menu). */
  trigger?: React.ReactNode | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const router = useRouter();
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const setOpen = onOpenChange ?? setOpenState;
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(squad?.name ?? "");
  const [logoUrl, setLogoUrl] = useState(squad?.logoUrl ?? "");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(squad ? `/api/admin/squads/${squad.id}` : "/api/admin/squads", {
        method: squad ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, logoUrl: logoUrl.trim() || null }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Não foi possível salvar.");
        return;
      }
      toast.success(squad ? "Squad atualizado." : "Squad criado.");
      setOpen(false);
      if (!squad) {
        setName("");
        setLogoUrl("");
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
          {trigger ?? (squad ? (
            <Button variant="ghost" size="icon">
              <Pencil className="size-4" />
            </Button>
          ) : (
            <Button>
              <Plus className="size-4" /> Adicionar squad
            </Button>
          ))}
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{squad ? "Editar squad" : "Novo squad"}</DialogTitle>
          <DialogDescription>
            {squad ? "Renomeia o squad ou troca o logo." : "Membros e clientes são adicionados na página do squad, depois de criado."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="squad-name">Nome</Label>
            <Input id="squad-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Squad Vanguard" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="squad-logo">Logo (link opcional)</Label>
            <Input
              id="squad-logo"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="/squads/vanguard.png ou https://..."
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              {squad ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
