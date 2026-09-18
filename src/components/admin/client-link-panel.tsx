"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, Input } from "@/components/ui/input";

type ClientOption = { id: string; name: string; company: string };
type LinkedClient = ClientOption & { role: string | null };

/** Equipes detail page's "Clientes" tab — the same link/unlink action seen from the teammate's
 *  side, hitting the same /api/admin/clients/[id]/team route the client detail page uses. */
export function ClientLinkPanel({
  teamMemberId,
  linked,
  available,
}: {
  teamMemberId: string;
  linked: LinkedClient[];
  available: ClientOption[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [pickerValue, setPickerValue] = useState("");
  const [roleValue, setRoleValue] = useState("");
  const unlinked = available.filter((a) => !linked.some((l) => l.id === a.id));

  async function link(clientId: string, role: string) {
    if (!clientId) return;
    setPending(true);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/team`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamMemberId, role: role.trim() || null }),
      });
      if (!res.ok) {
        toast.error("Não foi possível vincular.");
        return;
      }
      setPickerValue("");
      setRoleValue("");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function unlink(clientId: string) {
    setPending(true);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/team?teamMemberId=${teamMemberId}`, { method: "DELETE" });
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
        <p className="text-sm text-muted">Nenhum cliente vinculado a esta pessoa ainda.</p>
      ) : (
        <div className="flex flex-col divide-y divide-border rounded-lg border border-border">
          {linked.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-3 p-3">
              <Link href={`/clientes/${c.id}`} className="min-w-0">
                <div className="truncate text-sm font-medium hover:text-primary hover:underline">
                  {c.name}
                  {c.role && <span className="ml-1.5 font-normal text-muted">· {c.role}</span>}
                </div>
                <div className="truncate text-xs text-muted">{c.company}</div>
              </Link>
              <button
                type="button"
                disabled={pending}
                onClick={() => unlink(c.id)}
                className="shrink-0 text-muted-2 hover:text-negative"
                aria-label={`Desvincular ${c.name}`}
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {unlinked.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={pickerValue}
            onChange={(e) => setPickerValue(e.target.value)}
            className="max-w-64"
            aria-label="Vincular cliente"
          >
            <option value="">Selecione um cliente…</option>
            {unlinked.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} — {c.company}
              </option>
            ))}
          </Select>
          <Input
            value={roleValue}
            onChange={(e) => setRoleValue(e.target.value)}
            placeholder="Papel neste cliente (opcional)"
            className="max-w-56"
            aria-label="Papel neste cliente"
          />
          <Button type="button" size="sm" variant="outline" disabled={!pickerValue || pending} onClick={() => link(pickerValue, roleValue)}>
            <Plus className="size-4" /> Vincular
          </Button>
        </div>
      )}
    </div>
  );
}
