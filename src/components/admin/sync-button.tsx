"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SyncButton({ adAccountId }: { adAccountId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      const res = await fetch("/api/admin/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adAccountId }),
      });
      const data = await res.json();
      if (data.status === "ERROR") {
        toast.warning("Sincronização real não configurada — veja o log para detalhes.");
      } else if (res.ok) {
        toast.success(`Sincronizado: ${data.recordsSynced} registros atualizados.`);
      } else {
        toast.error("Falha ao sincronizar.");
      }
      router.refresh();
    });
  }

  return (
    <Button size="sm" variant="outline" onClick={onClick} disabled={pending}>
      {pending ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
      Sincronizar
    </Button>
  );
}
