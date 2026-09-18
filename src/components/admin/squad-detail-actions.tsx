"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SquadDialog, type EditableSquad } from "@/components/admin/squad-dialog";

/** Squad detail page header actions — edit (opens SquadDialog) + delete (confirm, then navigates
 *  back to /equipes since this page's own squad no longer exists after deletion). */
export function SquadDetailActions({ squad }: { squad: EditableSquad }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  function remove() {
    startTransition(async () => {
      const res = await fetch(`/api/admin/squads/${squad.id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Não foi possível excluir o squad.");
        return;
      }
      toast.success("Squad excluído.");
      router.push("/equipes");
      router.refresh();
    });
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted">Excluir squad?</span>
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
    <div className="flex items-center gap-2">
      <SquadDialog squad={squad} />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setConfirming(true)}
        className="text-negative hover:bg-negative-soft"
        aria-label="Excluir squad"
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}
