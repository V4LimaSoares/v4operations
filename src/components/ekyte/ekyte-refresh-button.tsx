"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Pulls fresh task data straight from Ekyte's official API (src/lib/ekyte-api.ts) into the
 *  EkyteSnapshot table — unlike RefreshNowButton, this one actually mutates data server-side. */
export function EkyteRefreshButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      const res = await fetch("/api/admin/ekyte/refresh", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Falha ao atualizar dados do Ekyte.");
        return;
      }
      toast.success(`Ekyte atualizado: ${data.taskCount} tarefas.`);
      router.refresh();
    });
  }

  return (
    <Button size="sm" variant="outline" onClick={onClick} disabled={pending}>
      {pending ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
      Atualizar agora
    </Button>
  );
}
