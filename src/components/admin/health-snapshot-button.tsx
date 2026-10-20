"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Calcula e grava hoje o Health Score de todos os clientes ativos (admin). Formar o histórico
 *  depende de rodar isso diariamente — pelo botão ou por um agendador com HEALTH_SNAPSHOT_SECRET. */
export function HealthSnapshotButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        try {
          const res = await fetch("/api/admin/health-score/snapshot", { method: "POST" });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            toast.error(data.error ?? "Não foi possível calcular.");
            return;
          }
          toast.success(`Saúde calculada para ${data.clients} cliente(s).`);
          router.refresh();
        } finally {
          setLoading(false);
        }
      }}
    >
      {loading ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
      Recalcular agora
    </Button>
  );
}
