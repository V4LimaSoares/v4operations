"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, Textarea } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";

type NoteType = "Reunião" | "Decisão" | "Risco" | "Observação";
const NOTE_TYPES: NoteType[] = ["Reunião", "Decisão", "Risco", "Observação"];

const TYPE_VARIANT: Record<NoteType, "info" | "default" | "negative" | "outline"> = {
  Reunião: "info",
  Decisão: "default",
  Risco: "negative",
  Observação: "outline",
};

export type AccountNote = {
  id: string;
  type: string;
  body: string;
  occurredAt: string;
  author: { name: string } | null;
};

/** Client detail page's Account tab — a lightweight relationship timeline (reuniões, decisões,
 *  riscos, observações) that had no home anywhere in the system before. */
export function AccountNotesPanel({ clientId, notes }: { clientId: string; notes: AccountNote[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<NoteType>("Observação");
  const [body, setBody] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, body }),
      });
      if (!res.ok) {
        toast.error("Não foi possível registrar.");
        return;
      }
      setBody("");
      setType("Observação");
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function remove(noteId: string) {
    const res = await fetch(`/api/admin/clients/${clientId}/notes?noteId=${noteId}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Não foi possível remover.");
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Histórico de relacionamento</h3>
        <Button type="button" size="sm" variant="outline" onClick={() => setOpen((v) => !v)}>
          <Plus className="size-4" /> Registrar
        </Button>
      </div>

      {open && (
        <Card className="mb-4 p-4">
          <form onSubmit={submit} className="flex flex-col gap-3">
            <Select value={type} onChange={(e) => setType(e.target.value as NoteType)} className="max-w-48">
              {NOTE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="O que aconteceu?"
              rows={3}
              required
            />
            <div className="flex justify-end">
              <Button type="submit" size="sm" disabled={loading}>
                {loading && <Loader2 className="size-4 animate-spin" />}
                Salvar
              </Button>
            </div>
          </form>
        </Card>
      )}

      {notes.length === 0 ? (
        <EmptyState message="Nenhum registro de relacionamento ainda." />
      ) : (
        <div className="flex flex-col gap-3">
          {notes.map((n) => (
            <Card key={n.id} className="p-4">
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant={TYPE_VARIANT[n.type as NoteType] ?? "outline"}>{n.type}</Badge>
                  <span className="text-xs text-muted">
                    {formatDate(new Date(n.occurredAt))}
                    {n.author && ` · ${n.author.name}`}
                  </span>
                </div>
                <button type="button" onClick={() => remove(n.id)} className="text-muted-2 hover:text-negative" aria-label="Remover registro">
                  <X className="size-3.5" />
                </button>
              </div>
              <p className="whitespace-pre-wrap text-sm text-foreground">{n.body}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
