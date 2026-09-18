"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";

type ClientOption = { id: string; name: string; company: string };

/** Squad detail page's "Clientes" panel — the portfolio this squad manages. Independent of any
 *  individual member's own client links (ClientTeamMember) — a squad's client list is its own
 *  thing. */
export function SquadClientPanel({
  squadId,
  linked,
  available,
}: {
  squadId: string;
  linked: ClientOption[];
  available: ClientOption[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [pickerValue, setPickerValue] = useState("");
  const unlinked = available.filter((a) => !linked.some((l) => l.id === a.id));

  async function link(clientId: string) {
    if (!clientId) return;
    setPending(true);
    try {
      const res = await fetch(`/api/admin/squads/${squadId}/clients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
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

  async function unlink(clientId: string) {
    setPending(true);
    try {
      const res = await fetch(`/api/admin/squads/${squadId}/clients?clientId=${clientId}`, { method: "DELETE" });
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
        <p className="text-sm text-muted">Nenhum cliente vinculado a este squad ainda.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {linked.map((c) => (
            <span key={c.id} className="flex items-center gap-2 rounded-full border border-border bg-surface-2 py-1 pl-3 pr-2.5 text-sm">
              <Link href={`/clientes/${c.id}`} className="hover:text-primary hover:underline">
                {c.name}
              </Link>
              <button
                type="button"
                disabled={pending}
                onClick={() => unlink(c.id)}
                className="text-muted-2 hover:text-negative"
                aria-label={`Desvincular ${c.name}`}
              >
                <X className="size-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {unlinked.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Select value={pickerValue} onChange={(e) => setPickerValue(e.target.value)} className="max-w-64" aria-label="Vincular cliente">
            <option value="">Selecione um cliente…</option>
            {unlinked.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} — {c.company}
              </option>
            ))}
          </Select>
          <Button type="button" size="sm" variant="outline" disabled={!pickerValue || pending} onClick={() => link(pickerValue)}>
            <Plus className="size-4" /> Vincular
          </Button>
        </div>
      )}
    </div>
  );
}
