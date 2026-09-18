"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { MoreHorizontal, Trash2, Pencil } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { SquadDialog, type EditableSquad } from "@/components/admin/squad-dialog";

/** Rendered as a sibling to the card's own `<Link>` (not nested inside it, same as
 *  TeamMemberDialog on the Equipes grid) so the menu never triggers card navigation. */
export function SquadRowActions({ squad }: { squad: EditableSquad }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [editing, setEditing] = useState(false);

  function remove() {
    startTransition(async () => {
      const res = await fetch(`/api/admin/squads/${squad.id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Não foi possível excluir o squad.");
        return;
      }
      toast.success("Squad excluído.");
      setConfirming(false);
      router.refresh();
    });
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5 rounded-lg bg-surface p-1 shadow-[var(--shadow-card)]">
        <span className="text-xs text-muted">Excluir?</span>
        <Button size="sm" variant="destructive" onClick={remove} disabled={pending}>
          Confirmar
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
          Cancelar
        </Button>
      </div>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={pending} aria-label="Mais ações do squad">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setEditing(true)}>
            <Pencil className="size-4" /> Editar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setConfirming(true)} className="text-negative">
            <Trash2 className="size-4" /> Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <SquadDialog squad={squad} trigger={null} open={editing} onOpenChange={setEditing} />
    </>
  );
}
