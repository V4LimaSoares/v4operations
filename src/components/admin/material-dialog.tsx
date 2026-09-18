"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, Upload, Link as LinkIcon, File as FileIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MATERIAL_CATEGORIES } from "@/lib/materials-constants";

type Mode = "file" | "link";

/** Upload de material — único formulário do sistema que envia `multipart/form-data` (todos os
 *  outros diálogos mandam JSON), porque precisa carregar um arquivo junto com os campos de texto.
 *  Um material é um arquivo OU um link externo (Drive, Docs, etc.), nunca os dois — o toggle troca
 *  qual dos dois campos aparece. */
export function MaterialDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<Mode>("file");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>(MATERIAL_CATEGORIES[0]);
  const [file, setFile] = useState<File | null>(null);
  const [linkUrl, setLinkUrl] = useState("");

  function reset() {
    setMode("file");
    setTitle("");
    setDescription("");
    setCategory(MATERIAL_CATEGORIES[0]);
    setFile(null);
    setLinkUrl("");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "file" && !file) {
      toast.error("Selecione um arquivo.");
      return;
    }
    if (mode === "link" && !linkUrl.trim()) {
      toast.error("Informe o link.");
      return;
    }
    setLoading(true);
    try {
      const form = new FormData();
      form.set("title", title);
      form.set("description", description);
      form.set("category", category);
      if (mode === "file" && file) form.set("file", file);
      if (mode === "link") form.set("linkUrl", linkUrl.trim());

      const res = await fetch("/api/admin/materiais", { method: "POST", body: form });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Não foi possível adicionar o material.");
        return;
      }
      toast.success("Material adicionado.");
      setOpen(false);
      reset();
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" /> Adicionar material
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo material</DialogTitle>
          <DialogDescription>Apresentações, playbooks e documentos de referência para o time.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="material-title">Título</Label>
            <Input id="material-title" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Playbook de Onboarding" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="material-category">Categoria</Label>
            <Select id="material-category" value={category} onChange={(e) => setCategory(e.target.value)}>
              {MATERIAL_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="material-description">Descrição (opcional)</Label>
            <Textarea
              id="material-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Um resumo curto do conteúdo"
              rows={3}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Conteúdo</Label>
            <div className="inline-flex w-fit gap-1 rounded-lg bg-surface-2 p-1">
              <button
                type="button"
                onClick={() => setMode("file")}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  mode === "file" ? "bg-surface shadow-sm" : "text-muted hover:text-foreground"
                )}
              >
                <FileIcon className="size-3.5" /> Arquivo
              </button>
              <button
                type="button"
                onClick={() => setMode("link")}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  mode === "link" ? "bg-surface shadow-sm" : "text-muted hover:text-foreground"
                )}
              >
                <LinkIcon className="size-3.5" /> Link
              </button>
            </div>
          </div>

          {mode === "file" ? (
            <div className="flex flex-col gap-1.5">
              <Input
                id="material-file"
                type="file"
                accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              <p className="text-xs text-muted-2">PDF, PPT, DOC, XLS ou imagem — até 25MB.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <Input
                id="material-link"
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://drive.google.com/..."
              />
              <p className="text-xs text-muted-2">Link do Google Drive, Docs, Notion ou qualquer outro endereço.</p>
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
              {mode === "file" ? "Enviar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
