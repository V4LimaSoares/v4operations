"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MODULES } from "@/lib/permissions";

const MODULE_GROUPS = Array.from(new Set(MODULES.map((m) => m.group)));

export type EditableProfile = {
  id: string;
  name: string;
  description: string | null;
  modules: string[];
  isSystem: boolean;
};

export function PermissionProfileDialog({ profile }: { profile?: EditableProfile }) {
  const router = useRouter();
  const isEdit = !!profile;
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(profile?.name ?? "");
  const [description, setDescription] = useState(profile?.description ?? "");
  const [modules, setModules] = useState<Set<string>>(new Set(profile?.modules ?? []));

  function toggleModule(key: string) {
    setModules((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(isEdit ? `/api/admin/permission-profiles/${profile!.id}` : "/api/admin/permission-profiles", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description: description || null, modules: Array.from(modules) }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Não foi possível salvar.");
        return;
      }
      toast.success(isEdit ? "Perfil atualizado." : "Perfil criado.");
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function onDelete() {
    if (!profile) return;
    if (!confirm(`Excluir o perfil "${profile.name}"? Usuários que o usam mantêm as permissões atuais.`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/permission-profiles/${profile.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Não foi possível excluir.");
        return;
      }
      toast.success("Perfil excluído.");
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="ghost" size="sm">
            <Pencil className="size-3.5" /> Editar
          </Button>
        ) : (
          <Button variant="outline">
            <Plus className="size-4" /> Novo perfil
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Editar perfil · ${profile!.name}` : "Novo perfil de permissão"}</DialogTitle>
          <DialogDescription>
            Um conjunto de módulos pré-definido para aplicar rapidamente a um usuário — como Gestor ou Operador.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pname">Nome do perfil</Label>
            <Input id="pname" required value={name} onChange={(e) => setName(e.target.value)} disabled={profile?.isSystem} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pdesc">Descrição</Label>
            <Textarea id="pdesc" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div>
            <Label>Módulos incluídos</Label>
            <div className="mt-2 flex flex-col gap-3 rounded-lg border border-border p-3">
              {MODULE_GROUPS.map((group) => (
                <div key={group}>
                  <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-2">{group}</div>
                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                    {MODULES.filter((m) => m.group === group).map((m) => (
                      <label key={m.key} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={modules.has(m.key)}
                          onChange={() => toggleModule(m.key)}
                          className="size-3.5 accent-[var(--color-primary)]"
                        />
                        {m.label}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="items-center justify-between sm:justify-between">
            {isEdit && !profile!.isSystem ? (
              <Button type="button" variant="ghost" onClick={onDelete} disabled={loading} className="text-negative hover:bg-negative-soft">
                <Trash2 className="size-4" /> Excluir
              </Button>
            ) : (
              <span />
            )}
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? "Salvar alterações" : "Criar perfil"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
