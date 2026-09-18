"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Send, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

const CONFIRM_TEXT: Record<string, string> = {
  weekly:
    "Gerar o relatório semanal agora envia uma mensagem de aprovação real para o grupo de WhatsApp SLA TRIAGEM (só vai para o grupo de clientes depois que alguém aprovar lá). Continuar?",
  monthly:
    "Gerar o relatório mensal agora envia uma mensagem de aprovação real para o grupo de WhatsApp SLA TRIAGEM (só vai para o grupo de clientes depois que alguém aprovar lá). Continuar?",
  daily: "", // no WhatsApp send — just regenerates the transcript file, no confirmation needed
};

/** "Solicitar" runs the real generation script on the VPS on demand (weekly/monthly post a real
 *  approval-request WhatsApp message — see CONFIRM_TEXT); "Baixar" downloads whatever the last
 *  generated report's text is, independent of WhatsApp approval status. */
export function SlaReportActions({ type }: { type: "weekly" | "monthly" | "daily" }) {
  const [loading, setLoading] = useState(false);

  async function solicitar() {
    const confirmText = CONFIRM_TEXT[type];
    if (confirmText && !confirm(confirmText)) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/sla/reports/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        toast.error("Não foi possível gerar o relatório agora.");
        return;
      }
      toast.success(
        type === "daily" ? "Overview diário regenerado." : "Relatório gerado e enviado para aprovação no TRIAGEM."
      );
    } catch {
      toast.error("Não foi possível conectar ao gerador de relatórios.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2 border-t border-border pt-3">
      <Button type="button" size="sm" variant="outline" onClick={solicitar} disabled={loading} className="flex-1">
        {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
        Solicitar
      </Button>
      <a
        href={`/api/admin/sla/reports/download?type=${type}`}
        className="inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-border bg-transparent px-3 h-8 text-xs font-medium transition-colors hover:bg-surface-2"
      >
        <Download className="size-3.5" />
        Baixar
      </a>
    </div>
  );
}
