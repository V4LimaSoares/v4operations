"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DownloadCloud, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Status = { status: string; pages: number; images: number; message?: string | null; report?: { created: number; updated: number; skippedEdited: number; imagesFailed: number; truncated: boolean; unsupportedTypes: Record<string, number> } | null };

export function NotionImportButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  async function poll(mode: "dry-run" | "import") {
    const res = await fetch("/api/admin/materiais/docs/import");
    const s: Status = await res.json();
    if (s.status === "RUNNING") {
      setInfo(`Lendo… ${s.pages} páginas`);
      return false;
    }
    if (timer.current) clearInterval(timer.current);
    setBusy(false);
    if (s.status === "ERROR") {
      toast.error(s.message ?? "Falha na importação.");
      setInfo(null);
    } else if (mode === "dry-run") {
      setInfo(`Encontrado: ${s.pages} páginas, ${s.images} imagens.`);
    } else {
      const r = s.report;
      setInfo(null);
      toast.success(`Importado: ${r?.created ?? 0} novos, ${r?.updated ?? 0} atualizados, ${r?.skippedEdited ?? 0} preservados.`);
      router.refresh();
    }
    return true;
  }

  async function start(mode: "dry-run" | "import") {
    if (mode === "import" && !confirm("Importar o Catálogo de Serviços do Notion? Documentos já editados aqui não serão sobrescritos.")) return;
    setBusy(true);
    setInfo("Iniciando…");
    const res = await fetch("/api/admin/materiais/docs/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode }) });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      toast.error(d.error ?? "Não foi possível iniciar.");
      setBusy(false);
      setInfo(null);
      return;
    }
    timer.current = setInterval(() => void poll(mode), 2500);
  }

  return (
    <div className="flex items-center gap-2">
      {info && <span className="text-xs text-muted">{info}</span>}
      <Button variant="outline" onClick={() => start("dry-run")} disabled={busy}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : <DownloadCloud className="size-4" />} Contar
      </Button>
      <Button onClick={() => start("import")} disabled={busy}>Importar do Notion</Button>
    </div>
  );
}
