"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, Input } from "@/components/ui/input";

type MemberOption = { id: string; name: string; colorVar: string };
type LinkedMember = MemberOption & { role: string | null };

/** Squad detail page's "Membros" panel — who's in this squad, with a role specific to the squad
 *  (e.g. "Account", "Designer") — independent of the person's agency-wide title and of any role
 *  they carry on an individual client. */
export function SquadMemberPanel({
  squadId,
  linked,
  available,
}: {
  squadId: string;
  linked: LinkedMember[];
  available: MemberOption[];
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
      const res = await fetch(`/api/admin/squads/${squadId}/members`, {
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
      const res = await fetch(`/api/admin/squads/${squadId}/members?teamMemberId=${teamMemberId}`, { method: "DELETE" });
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
        <p className="text-sm text-muted">Nenhuma pessoa vinculada a este squad ainda.</p>
      ) : (
        <div className="flex flex-col divide-y divide-border rounded-lg border border-border">
          {linked.map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-3 p-3">
              <Link href={`/equipes/${m.id}`} className="flex min-w-0 items-center gap-2.5">
                <span
                  className="flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ background: m.colorVar }}
                >
                  {m.name[0]}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium hover:text-primary hover:underline">{m.name}</div>
                  {m.role && <div className="truncate text-xs text-muted">{m.role}</div>}
                </div>
              </Link>
              <button
                type="button"
                disabled={pending}
                onClick={() => unlink(m.id)}
                className="shrink-0 text-muted-2 hover:text-negative"
                aria-label={`Desvincular ${m.name}`}
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {unlinked.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Select value={pickerValue} onChange={(e) => setPickerValue(e.target.value)} className="max-w-64" aria-label="Vincular pessoa">
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
            placeholder="Papel no squad (ex: Account)"
            className="max-w-56"
            aria-label="Papel no squad"
          />
          <Button type="button" size="sm" variant="outline" disabled={!pickerValue || pending} onClick={() => link(pickerValue, roleValue)}>
            <Plus className="size-4" /> Vincular
          </Button>
        </div>
      )}
    </div>
  );
}
