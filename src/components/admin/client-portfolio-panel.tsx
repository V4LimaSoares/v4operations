"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { X, Plus, Pencil, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PORTFOLIO_CATEGORY_LABEL } from "@/lib/portfolio-constants";
import { formatBRL } from "@/lib/utils";
import type { PortfolioCategory } from "@prisma/client";

type PortfolioOption = { id: string; category: PortfolioCategory; service: string; variation: string | null; valueBrl: number | null };
type LinkedItem = PortfolioOption & { customValueBrl: number | null };

/** Client detail page's "Portfólio" tab — which catalog items (see /portfolio) this client has
 *  contracted, each optionally with its own negotiated price. Categoria/serviço/variação never
 *  change here (they come from the shared catalog); only the value can be personalized per
 *  client — null means "usa o valor base do catálogo". */
export function ClientPortfolioPanel({
  clientId,
  linked,
  available,
}: {
  clientId: string;
  linked: LinkedItem[];
  available: PortfolioOption[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [pickerValue, setPickerValue] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
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

  function startEdit(item: LinkedItem) {
    setEditingId(item.id);
    setEditValue(item.customValueBrl != null ? String(item.customValueBrl) : "");
  }

  async function saveValue(itemId: string) {
    setPending(true);
    try {
      const customValueBrl = editValue.trim() ? Number(editValue) : null;
      const res = await fetch(`/api/admin/clients/${clientId}/portfolio`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, customValueBrl }),
      });
      if (!res.ok) {
        toast.error("Não foi possível salvar o valor.");
        return;
      }
      toast.success("Valor atualizado.");
      setEditingId(null);
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
          {linked.map((i) => {
            const isCustom = i.customValueBrl != null;
            const isEditing = editingId === i.id;
            return (
              <div key={i.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface-2 px-3 py-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{PORTFOLIO_CATEGORY_LABEL[i.category]}</Badge>
                    <span className="truncate text-sm font-medium">{i.service}</span>
                    {i.variation && <span className="text-xs text-muted">({i.variation})</span>}
                  </div>

                  {isEditing ? (
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        autoFocus
                        placeholder={i.valueBrl != null ? String(i.valueBrl) : "A definir"}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="h-7 w-32 text-xs"
                      />
                      <Button size="sm" variant="outline" disabled={pending} onClick={() => saveValue(i.id)}>
                        <Check className="size-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                        Cancelar
                      </Button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => startEdit(i)}
                      className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-2 hover:text-foreground"
                    >
                      <span className={isCustom ? "font-semibold text-foreground" : ""}>
                        {isCustom ? formatBRL(i.customValueBrl!) : i.valueBrl != null ? formatBRL(i.valueBrl) : "A definir"}
                      </span>
                      {isCustom && <Badge variant="warning">Personalizado</Badge>}
                      <Pencil className="size-3" />
                    </button>
                  )}
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
            );
          })}
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
