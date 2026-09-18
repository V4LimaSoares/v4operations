"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Generic "Atualizar agora" affordance for pages whose data is already fetched live/no-store on
 *  every render (Controle de SLA, Squad, Cliente) — just forces a fresh server round-trip so the
 *  user gets visible confirmation the numbers are current, without needing a backend mutation. */
export function RefreshNowButton({ label = "Atualizar agora" }: { label?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onClick() {
    startTransition(() => {
      router.refresh();
      toast.success("Dados atualizados.");
    });
  }

  return (
    <Button size="sm" variant="outline" onClick={onClick} disabled={pending}>
      {pending ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
      {label}
    </Button>
  );
}
