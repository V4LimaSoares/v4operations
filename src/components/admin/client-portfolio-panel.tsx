"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PORTFOLIO_CATEGORY_LABEL } from "@/lib/portfolio-constants";
import { formatBRL } from "@/lib/utils";
import type { PortfolioCategory } from "@prisma/client";

type PortfolioOption = { id: string; category: PortfolioCategory; service: string; variation: string | null; valueBrl: number | null };

/** Client detail page's "Portfólio" tab — which catalog items (see /portfolio) this client has
 *  contracted. Independent from the catalog's own admin editing; this just links/unlinks. */
export function ClientPortfolioPanel({
  clientId,
  linked,
  available,
}: {
  clientId: string;
  linked: PortfolioOption[];
  available: PortfolioOption[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [pickerValue, setPickerValue] = useState("");
  const unlinked = available.filter((a) => !linked.some((l) => l.id === a.id));

  async function link(itemId: string) {
    if (!itemId) return;
    setPending(true);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/portfolio`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      if (!res.ok) {
        toast.error("Não foi possível vincular.");
        return;
      }
      setPickerValue("");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function unlink(itemId: string) {
    setPending(true);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/portfolio?itemId=${itemId}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Não foi possível desvincular.");
        return;
      }
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {linked.length === 0 ? (
        <p className="text-sm text-muted">Nenhum serviço do portfólio vinculado a este cliente ainda.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {linked.map((i) => (
            <div key={i.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface-2 px-3 py-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{PORTFOLIO_CATEGORY_LABEL[i.category]}</Badge>
                  <span className="truncate text-sm font-medium">{i.service}</span>
                  {i.variation && <span className="text-xs text-muted">({i.variation})</span>}
                </div>
                <p className="mt-0.5 text-xs text-muted-2">{i.valueBrl != null ? formatBRL(i.valueBrl) : "A definir"}</p>
              </div>
              <button
                type="button"
                disabled={pending}
                onClick={() => unlink(i.id)}
                className="shrink-0 text-muted-2 hover:text-negative"
                aria-label={`Desvincular ${i.service}`}
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {unlinked.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Select value={pickerValue} onChange={(e) => setPickerValue(e.target.value)} className="max-w-80" aria-label="Vincular item do portfólio">
            <option value="">Selecione um serviço…</option>
            {unlinked.map((i) => (
              <option key={i.id} value={i.id}>
                [{PORTFOLIO_CATEGORY_LABEL[i.category]}] {i.service}
                {i.variation ? ` — ${i.variation}` : ""}
              </option>
            ))}
          </Select>
          <Button type="button" size="sm" variant="outline" disabled={!pickerValue || pending} onClick={() => link(pickerValue)}>
            <Plus className="size-4" /> Vincular
          </Button>
        </div>
      )}

      <Link href="/portfolio" className="text-xs font-medium text-primary hover:underline">
        Ver catálogo completo →
      </Link>
    </div>
  );
}
