"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { MoreHorizontal, Trash2, PauseCircle, PlayCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { ClientStatus } from "@prisma/client";

export function ClientRowActions({ id, status }: { id: string; status: ClientStatus }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  function toggleStatus() {
    startTransition(async () => {
      const nextStatus: ClientStatus = status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      const res = await fetch(`/api/admin/clients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) {
        toast.error("Não foi possível atualizar o status.");
        return;
      }
      toast.success(nextStatus === "ACTIVE" ? "Cliente reativado." : "Cliente desativado.");
      router.refresh();
    });
  }

  function remove() {
    startTransition(async () => {
      const res = await fetch(`/api/admin/clients/${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Não foi possível excluir o cliente.");
        return;
      }
      toast.success("Cliente excluído.");
      setConfirming(false);
      router.refresh();
    });
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted">Excluir permanentemente?</span>
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={pending}>
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={toggleStatus}>
          {status === "ACTIVE" ? <PauseCircle className="size-4" /> : <PlayCircle className="size-4" />}
          {status === "ACTIVE" ? "Desativar" : "Reativar"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => setConfirming(true)} className="text-negative">
          <Trash2 className="size-4" /> Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
