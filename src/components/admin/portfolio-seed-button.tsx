"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DownloadCloud, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Admin-only: (re)imports the 73-item V4 catalog. Safe to click any time — it upserts by
 *  (service, variation), so re-running only fills in what's missing or updates category/valor/
 *  descrição on existing rows, never duplicates. This is how the catalog reaches production. */
export function PortfolioSeedButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/portfolio/seed", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error("Não foi possível importar.");
        return;
      }
      const { created, updated } = data as { created: number; updated: number };
      toast.success(created + updated === 0 ? "Já estava tudo importado." : `${created} criado(s), ${updated} atualizado(s).`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" onClick={onClick} disabled={loading}>
      {loading ? <Loader2 className="size-4 animate-spin" /> : <DownloadCloud className="size-4" />}
      Importar catálogo
    </Button>
  );
}
