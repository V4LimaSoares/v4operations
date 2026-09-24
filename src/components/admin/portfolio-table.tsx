"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PortfolioItemDialog, type EditablePortfolioItem } from "@/components/admin/portfolio-item-dialog";
import { cn, formatBRL } from "@/lib/utils";

/** A card list instead of a wide table — a "Descrição" column with paragraph-length text forces
 *  either a huge table (desktop) or an unusable one (mobile, where only the first column fits and
 *  every other field needs horizontal scrolling with no hint it's there). Cards read the same way
 *  at any width: no breakpoint-specific layout needed. */
export function PortfolioCategoryTable({ items, isAdmin }: { items: EditablePortfolioItem[]; isAdmin: boolean }) {
  return (
    <div className="flex flex-col gap-2.5">
      {items.map((item) => (
        <PortfolioItemCard key={item.id} item={item} isAdmin={isAdmin} />
      ))}
    </div>
  );
}

function PortfolioItemCard({ item, isAdmin }: { item: EditablePortfolioItem; isAdmin: boolean }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);

  async function remove() {
    setPending(true);
    try {
      const res = await fetch(`/api/admin/portfolio/${item.id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Não foi possível excluir.");
        return;
      }
      toast.success("Excluído.");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  const hasLongDescription = (item.description?.length ?? 0) > 140;

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="text-sm font-semibold">{item.service}</h3>
            {item.variation && <Badge variant="outline">{item.variation}</Badge>}
            <Badge variant={item.status === "Ativo" ? "positive" : "outline"}>{item.status}</Badge>
          </div>
          {item.description && (
            <p className={cn("mt-1.5 text-sm text-muted", !expanded && "line-clamp-2")}>{item.description}</p>
          )}
          {hasLongDescription && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              {expanded ? "Ver menos" : "Ver mais"}
              <ChevronDown className={cn("size-3 transition-transform", expanded && "rotate-180")} />
            </button>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <span className="whitespace-nowrap text-sm font-semibold tabular-nums">
            {item.valueBrl != null ? formatBRL(item.valueBrl) : "A definir"}
          </span>
          {isAdmin &&
            (confirming ? (
              <div className="flex items-center gap-1">
                <Button size="sm" variant="destructive" disabled={pending} onClick={remove}>
                  Confirmar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
                  Cancelar
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <PortfolioItemDialog item={item} />
                <Button variant="ghost" size="icon" className="text-negative" onClick={() => setConfirming(true)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
        </div>
      </div>
    </Card>
  );
}
