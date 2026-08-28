"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function GenerateInsightsButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      const res = await fetch("/api/insights/generate", { method: "POST" });
      if (!res.ok) {
        toast.error("Não foi possível gerar os insights.");
        return;
      }
      toast.success("Insights atualizados.");
      router.refresh();
    });
  }

  return (
    <Button onClick={onClick} disabled={pending} variant="outline">
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
      Gerar insights agora
    </Button>
  );
}
