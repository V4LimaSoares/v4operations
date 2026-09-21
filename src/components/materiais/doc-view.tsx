"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Pencil, Trash2, ArrowUp, ArrowDown, ExternalLink, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { MarkdownView } from "@/components/materiais/markdown-view";
import { NewDocButton } from "@/components/materiais/new-doc-button";
import { formatDateTime } from "@/lib/utils";

export type DocViewData = {
  id: string;
  parentId: string | null;
  title: string;
  icon: string | null;
  contentMd: string;
  props: Record<string, string> | null;
  sourceUrl: string | null;
  updatedAt: string;
  updatedByName: string | null;
  children: { id: string; title: string; icon: string | null }[];
};

/** Reader for everyone; Administrador additionally sees edit/move/delete/new-subpage controls. Editing
 *  is a Markdown textarea with a live preview beside it (see MarkdownView). */
export function DocView({ doc, isAdmin }: { doc: DocViewData; isAdmin: boolean }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [title, setTitle] = useState(doc.title);
  const [contentMd, setContentMd] = useState(doc.contentMd);

  async function call(url: string, init: RequestInit) {
    setLoading(true);
    try {
      const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...init });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Não foi possível concluir.");
        return null;
      }
      return data;
    } finally {
      setLoading(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const data = await call(`/api/admin/materiais/docs/${doc.id}`, { method: "PATCH", body: JSON.stringify({ title, contentMd }) });
    if (data) {
      toast.success("Documento salvo.");
      setEditing(false);
      router.refresh();
    }
  }

  async function move(direction: "up" | "down") {
    const data = await call(`/api/admin/materiais/docs/${doc.id}`, { method: "PATCH", body: JSON.stringify({ move: direction }) });
    if (data) router.refresh();
  }

  async function remove() {
    const data = await call(`/api/admin/materiais/docs/${doc.id}`, { method: "DELETE" });
    if (data) {
      toast.success("Documento excluído.");
      router.push(data.parentId ? `/materiais/docs/${data.parentId}` : "/materiais/docs");
      router.refresh();
    }
  }

  if (editing) {
    return (
      <form onSubmit={save} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="doc-title">Título</Label>
            <Input id="doc-title" required value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="doc-content">Conteúdo (Markdown)</Label>
            <Textarea
              id="doc-content"
              value={contentMd}
              onChange={(e) => setContentMd(e.target.value)}
              className="min-h-[60vh] font-mono text-xs leading-relaxed"
              placeholder={"# Título\n\nEscreva em Markdown: **negrito**, listas com -, links [texto](url), tabelas…"}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Pré-visualização</Label>
            <Card className="max-h-[60vh] min-h-[60vh] overflow-y-auto p-5">
              <MarkdownView>{contentMd || "*Nada escrito ainda.*"}</MarkdownView>
            </Card>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Button type="button" variant="ghost" disabled={loading} onClick={() => { setTitle(doc.title); setContentMd(doc.contentMd); setEditing(false); }}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="size-4 animate-spin" />} Salvar
          </Button>
        </div>
      </form>
    );
  }

  const chips = doc.props ? Object.entries(doc.props).filter(([, v]) => v) : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">
            {doc.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {chips.map(([k, v]) => (
              <Badge key={k} variant="outline">
                {k}: {v}
              </Badge>
            ))}
            <span className="text-xs text-muted-2">
              {doc.updatedByName ? `Editado por ${doc.updatedByName} · ` : ""}
              {formatDateTime(doc.updatedAt)}
            </span>
            {doc.sourceUrl && (
              <a href={doc.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-muted hover:text-foreground">
                <ExternalLink className="size-3" /> Fonte original
              </a>
            )}
          </div>
        </div>
        {isAdmin && (
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="icon" disabled={loading} onClick={() => move("up")} aria-label="Mover para cima">
              <ArrowUp className="size-4" />
            </Button>
            <Button variant="outline" size="icon" disabled={loading} onClick={() => move("down")} aria-label="Mover para baixo">
              <ArrowDown className="size-4" />
            </Button>
            <NewDocButton parentId={doc.id} label="Nova sub-página" />
            <Button onClick={() => setEditing(true)}>
              <Pencil className="size-4" /> Editar
            </Button>
            {confirmingDelete ? (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted">Apaga também as sub-páginas. Excluir?</span>
                <Button size="sm" variant="destructive" disabled={loading} onClick={remove}>
                  Confirmar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirmingDelete(false)}>
                  Cancelar
                </Button>
              </div>
            ) : (
              <Button variant="ghost" size="icon" className="text-negative" onClick={() => setConfirmingDelete(true)} aria-label="Excluir">
                <Trash2 className="size-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      {doc.contentMd ? (
        <Card className="p-6 lg:p-8">
          <MarkdownView>{doc.contentMd}</MarkdownView>
        </Card>
      ) : (
        <Card className="p-8 text-center text-sm text-muted">Esta página ainda não tem conteúdo.</Card>
      )}

      {doc.children.length > 0 && (
        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-2">Sub-páginas</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {doc.children.map((c) => (
              <Link key={c.id} href={`/materiais/docs/${c.id}`}>
                <Card className="flex items-center gap-3 p-4 transition-all hover:-translate-y-0.5 hover:border-muted-2 hover:shadow-lg">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-base text-primary">
                    <FileText className="size-4" />
                  </span>
                  <span className="truncate text-sm font-medium">{c.title}</span>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
