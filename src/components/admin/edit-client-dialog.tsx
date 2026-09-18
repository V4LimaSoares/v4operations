"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Pencil } from "lucide-react";
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

export type EditableClient = {
  id: string;
  name: string;
  company: string;
  notes: string | null;
  slaGroupName: string | null;
  ekyteClientName: string | null;
};

/** Edits a Client's core fields — including slaGroupName/ekyteClientName, the two fields that
 *  join this record to the live SLA and Ekyte snapshots. Lets a staff member resolve a "sem
 *  match" account (Contas page) or a mismatched SLA/Ekyte tab by hand, without a DB script. */
export function EditClientDialog({
  client,
  trigger,
  open: openProp,
  onOpenChange,
}: {
  client: EditableClient;
  /** Omit to get the dialog's own edit-icon button as the trigger; pass `null` to render no
   *  trigger at all (fully controlled via `open`/`onOpenChange` — e.g. from a dropdown item). */
  trigger?: React.ReactNode | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const router = useRouter();
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const setOpen = onOpenChange ?? setOpenState;
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(client.name);
  const [company, setCompany] = useState(client.company);
  const [notes, setNotes] = useState(client.notes ?? "");
  const [slaGroupName, setSlaGroupName] = useState(client.slaGroupName ?? "");
  const [ekyteClientName, setEkyteClientName] = useState(client.ekyteClientName ?? "");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/clients/${client.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          company,
          notes: notes.trim() || null,
          slaGroupName: slaGroupName.trim() || null,
          ekyteClientName: ekyteClientName.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Não foi possível salvar.");
        return;
      }
      toast.success("Cliente atualizado.");
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger !== null && (
        <DialogTrigger asChild>
          {trigger ?? (
            <Button variant="ghost" size="icon">
              <Pencil className="size-4" />
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar cliente</DialogTitle>
          <DialogDescription>
            Os campos de SLA e Ekyte definem o vínculo com o grupo de WhatsApp e o nome usado no Ekyte — corrija aqui
            quando o cruzamento automático não bater.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-name">Nome</Label>
            <Input id="edit-name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-company">Empresa</Label>
            <Input id="edit-company" required value={company} onChange={(e) => setCompany(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-sla">Nome exato do grupo de SLA (WhatsApp)</Label>
            <Input
              id="edit-sla"
              placeholder="Ex: V4 Company + Nome do Cliente"
              value={slaGroupName}
              onChange={(e) => setSlaGroupName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-ekyte">Nome exato do cliente no Ekyte</Label>
            <Input id="edit-ekyte" value={ekyteClientName} onChange={(e) => setEkyteClientName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-notes">Notas</Label>
            <Textarea id="edit-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
