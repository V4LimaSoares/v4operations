"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Users2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Admin-only: makes sure every Client in "Clientes" also has a row here — new clients already
 *  get one automatically on creation, this is the manual catch-up for whatever predates that or
 *  was added another way (e.g. a spreadsheet import). Safe to click any time: it never touches a
 *  client that already has an entry. */
export function SyncHealthScoreButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/health-score/sync", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error("Não foi possível sincronizar.");
        return;
      }
      const { linked, created } = data as { linked: number; created: number };
      if (linked + created === 0) {
        toast.success("Já estava tudo sincronizado.");
      } else {
        toast.success(`Sincronizado: ${created} cliente(s) novo(s), ${linked} registro(s) vinculado(s).`);
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button size="sm" variant="outline" onClick={onClick} disabled={loading}>
      {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Users2 className="size-3.5" />}
      Sincronizar com Clientes
    </Button>
  );
}
