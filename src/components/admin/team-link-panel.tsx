"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, Input } from "@/components/ui/input";

type TeamOption = { id: string; name: string; colorVar: string };
type LinkedTeamMember = TeamOption & { role: string | null };

/** Client detail page's "Equipe" tab — who's linked to this client, with add/remove. Each link
 *  carries its own `role` — the person's function on THIS client, not their job title at the
 *  agency in general (that's TeamMember's own, set on the Equipes page). */
export function TeamLinkPanel({
  clientId,
  linked,
  available,
}: {
  clientId: string;
  linked: LinkedTeamMember[];
  available: TeamOption[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [pickerValue, setPickerValue] = useState("");
  const [roleValue, setRoleValue] = useState("");
  const unlinked = available.filter((a) => !linked.some((l) => l.id === a.id));

  async function link(teamMemberId: string, role: string) {
    if (!teamMemberId) return;
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

  async function unlink(teamMemberId: string) {
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
        <p className="text-sm text-muted">Nenhuma pessoa da equipe vinculada a este cliente ainda.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {linked.map((m) => (
            <span
              key={m.id}
              className="flex items-center gap-2 rounded-full border border-border bg-surface-2 py-1 pl-1 pr-2.5 text-sm"
            >
              <span
                className="flex size-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ background: m.colorVar }}
              >
                {m.name[0]}
              </span>
              {m.name}
              {m.role && <span className="text-xs text-muted">· {m.role}</span>}
              <button
                type="button"
                disabled={pending}
                onClick={() => unlink(m.id)}
                className="text-muted-2 hover:text-negative"
                aria-label={`Desvincular ${m.name}`}
              >
                <X className="size-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {unlinked.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={pickerValue}
            onChange={(e) => setPickerValue(e.target.value)}
            className="max-w-64"
            aria-label="Vincular pessoa da equipe"
          >
            <option value="">Selecione uma pessoa…</option>
            {unlinked.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
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
            <UserPlus className="size-4" /> Vincular
          </Button>
        </div>
      )}
    </div>
  );
}
