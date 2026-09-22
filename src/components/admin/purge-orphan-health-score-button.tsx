"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Admin-only: removes Health Score entries that don't belong to any current Client — leftovers
 *  from the original spreadsheet import (duplicates or names that never matched a real client).
 *  Irreversible, so it confirms first. */
export function PurgeOrphanHealthScoreButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onClick() {
    if (!confirm("Remover da Health Score os registros que não pertencem a nenhum cliente cadastrado? Essa ação não pode ser desfeita.")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/health-score/purge-orphans", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error("Não foi possível remover.");
        return;
      }
      const { removed } = data as { removed: number };
      toast.success(removed === 0 ? "Nenhum registro sem cliente encontrado." : `${removed} registro(s) removido(s).`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button size="sm" variant="outline" onClick={onClick} disabled={loading} className="text-negative hover:text-negative">
      {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
      Remover sem cliente
    </Button>
  );
}
