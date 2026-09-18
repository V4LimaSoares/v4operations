"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Loader2,
  Pencil,
  Trash2,
  Download,
  ExternalLink,
  Presentation,
  BookOpen,
  FileText,
  File as FileIcon,
  User,
  CalendarClock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { MATERIAL_CATEGORIES } from "@/lib/materials-constants";
import { formatDateTime, cn } from "@/lib/utils";
import type { MaterialCardData } from "@/components/admin/material-card";

const CATEGORY_ICON: Record<string, typeof FileText> = {
  Apresentação: Presentation,
  Playbook: BookOpen,
  Documento: FileText,
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Opened by clicking a material card. Read-only for everyone; Administrador additionally gets
 *  "Editar" (title/category/description/link) and "Excluir" — mirrors the locked/unlocked
 *  pattern already used in HealthScoreDialog. */
export function MaterialDetailDialog({
  material,
  isAdmin,
  open,
  onOpenChange,
}: {
  material: MaterialCardData;
  isAdmin: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [title, setTitle] = useState(material.title);
  const [description, setDescription] = useState(material.description ?? "");
  const [category, setCategory] = useState(material.category);
  const [linkUrl, setLinkUrl] = useState(material.linkUrl ?? "");

  const Icon = material.linkUrl ? ExternalLink : CATEGORY_ICON[material.category] ?? FileIcon;

  function resetForm() {
    setTitle(material.title);
    setDescription(material.description ?? "");
    setCategory(material.category);
    setLinkUrl(material.linkUrl ?? "");
    setEditing(false);
  }

  function close(next: boolean) {
    if (!next) resetForm();
    onOpenChange(next);
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/materiais/${material.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || null,
          category,
          ...(material.linkUrl && { linkUrl }),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Não foi possível salvar.");
        return;
      }
      toast.success("Material atualizado.");
      setEditing(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function onDelete() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/materiais/${material.id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Não foi possível excluir o material.");
        return;
      }
      toast.success("Material excluído.");
      close(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-lg">
        {editing ? (
          <>
            <DialogHeader>
              <DialogTitle>Editar material</DialogTitle>
              <DialogDescription>Só o Administrador pode alterar.</DialogDescription>
            </DialogHeader>
            <form onSubmit={onSave} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-material-title">Título</Label>
                <Input id="edit-material-title" required value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-material-category">Categoria</Label>
                <Select id="edit-material-category" value={category} onChange={(e) => setCategory(e.target.value)}>
                  {MATERIAL_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-material-description">Descrição</Label>
                <Textarea
                  id="edit-material-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={8}
                  className="font-mono text-xs leading-relaxed"
                  placeholder="A formatação (quebras de linha, espaços) é preservada exatamente como digitada."
                />
              </div>
              {material.linkUrl && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="edit-material-link">Link</Label>
                  <Input id="edit-material-link" type="url" required value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
                </div>
              )}
              <DialogFooter className="items-center justify-between sm:justify-between">
                <Button type="button" variant="ghost" onClick={resetForm} disabled={loading}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="size-4 animate-spin" />}
                  Salvar
                </Button>
              </DialogFooter>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "flex size-12 shrink-0 items-center justify-center rounded-2xl shadow-[0_4px_16px_-4px_rgba(0,0,0,0.35)]",
                      material.linkUrl ? "bg-info-soft text-info" : "bg-primary-soft text-primary"
                    )}
                  >
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0 pt-0.5">
                    <DialogTitle className="text-base leading-snug">{material.title}</DialogTitle>
                    <Badge variant="outline" className="mt-1.5">
                      {material.category}
                    </Badge>
                  </div>
                </div>
                {isAdmin && (
                  <Button type="button" size="sm" variant="outline" onClick={() => setEditing(true)} className="shrink-0">
                    <Pencil className="size-3.5" /> Editar
                  </Button>
                )}
              </div>
            </DialogHeader>

            <div className="flex flex-col gap-4">
              {material.description && (
                <div className="max-h-64 overflow-y-auto scrollbar-thin rounded-xl border border-border/60 bg-surface-2/40 p-4">
                  <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">{material.description}</p>
                </div>
              )}

              <div className="flex flex-col gap-2 rounded-xl border border-border/60 bg-surface-2/40 p-4 text-xs text-muted">
                <div className="flex items-center gap-2">
                  {material.linkUrl ? <ExternalLink className="size-3.5 shrink-0" /> : <FileIcon className="size-3.5 shrink-0" />}
                  <span className="truncate">
                    {material.linkUrl ? material.linkUrl : `${material.fileName} · ${formatBytes(material.fileSizeBytes ?? 0)}`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="size-3.5 shrink-0" />
                  <span>{material.uploadedByName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarClock className="size-3.5 shrink-0" />
                  <span>{formatDateTime(material.createdAt)}</span>
                </div>
              </div>
            </div>

            <DialogFooter className="items-center justify-between sm:justify-between">
              {isAdmin ? (
                confirmingDelete ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted">Excluir?</span>
                    <Button size="sm" variant="destructive" onClick={onDelete} disabled={loading}>
                      Confirmar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setConfirmingDelete(false)}>
                      Cancelar
                    </Button>
                  </div>
                ) : (
                  <Button type="button" variant="ghost" onClick={() => setConfirmingDelete(true)} disabled={loading} className="text-negative hover:bg-negative-soft">
                    <Trash2 className="size-4" /> Excluir
                  </Button>
                )
              ) : (
                <span />
              )}
              {material.linkUrl ? (
                <Button asChild>
                  <a href={material.linkUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="size-4" /> Abrir link
                  </a>
                </Button>
              ) : (
                <Button asChild>
                  <a href={`/api/materiais/${material.id}/download`}>
                    <Download className="size-4" /> Baixar
                  </a>
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
