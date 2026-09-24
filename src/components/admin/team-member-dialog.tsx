"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { TeamAvatar } from "@/components/admin/team-avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";

export type EditableTeamMember = {
  id: string;
  name: string;
  role: string;
  colorVar: string;
  photoUrl?: string | null;
  userId: string | null;
  birthDate?: Date | string | null;
  hireDate?: Date | string | null;
  address?: string | null;
  email?: string | null;
};
export type AvailableUser = { id: string; name: string; email: string };

// Neutral fallback for the color swatch when the current colorVar is a CSS var reference
// (var(--c-monica), etc.) rather than a literal hex — native <input type="color"> can't display
// a var() value, and we don't want to guess/resolve it just to show a swatch.
const HEX_FALLBACK = "#6b7280";
const isHex = (v: string) => /^#[0-9a-fA-F]{6}$/.test(v);

function toISODate(d: Date | string | null | undefined): string {
  if (!d) return "";
  return typeof d === "string" ? d.slice(0, 10) : d.toISOString().slice(0, 10);
}

/** Edit an existing profile when `member` is given; otherwise renders "Adicionar membro" — a
 *  free-form create (nome/cargo/cor), with an optional link to an existing Administração account.
 *  Linking is a choice, not a requirement: a person can exist in Equipes without ever having a
 *  login. */
export function TeamMemberDialog({ member, availableUsers = [] }: { member?: EditableTeamMember; availableUsers?: AvailableUser[] }) {
  return member ? <EditMemberDialog member={member} /> : <AddMemberDialog availableUsers={availableUsers} />;
}

function AddMemberDialog({ availableUsers }: { availableUsers: AvailableUser[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [userId, setUserId] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, role: role || "Equipe", userId: userId || null }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Não foi possível adicionar.");
        return;
      }
      toast.success("Pessoa adicionada à equipe.");
      setOpen(false);
      setName("");
      setRole("");
      setUserId("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" /> Adicionar membro
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar membro à equipe</DialogTitle>
          <DialogDescription>Vincular a uma conta de Administração é opcional — pode adicionar mesmo sem login.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-team-name">Nome</Label>
            <Input id="new-team-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Ana Souza" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-team-role">Função</Label>
            <Input id="new-team-role" placeholder="Ex: Gestor de Tráfego" value={role} onChange={(e) => setRole(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-team-user">Vincular a um usuário (opcional)</Label>
            <Select id="new-team-user" value={userId} onChange={(e) => setUserId(e.target.value)}>
              <option value="">— Nenhum —</option>
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              Adicionar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditMemberDialog({ member }: { member: EditableTeamMember }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(member.name);
  const [role, setRole] = useState(member.role);
  const [color, setColor] = useState(isHex(member.colorVar) ? member.colorVar : HEX_FALLBACK);
  const [colorTouched, setColorTouched] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(member.photoUrl ?? null);
  const [photoVersion, setPhotoVersion] = useState(0);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [birthDate, setBirthDate] = useState(toISODate(member.birthDate));
  const [hireDate, setHireDate] = useState(toISODate(member.hireDate));
  const [address, setAddress] = useState(member.address ?? "");
  const [email, setEmail] = useState(member.email ?? "");
  const isLinked = !!member.userId;

  async function onPhotoSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPhotoLoading(true);
    try {
      const form = new FormData();
      form.set("file", file);
      const res = await fetch(`/api/admin/team/${member.id}/photo`, { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Não foi possível enviar a foto.");
        return;
      }
      setPhotoUrl(data.photoUrl);
      setPhotoVersion(Date.now());
      toast.success("Foto atualizada.");
      router.refresh();
    } finally {
      setPhotoLoading(false);
    }
  }

  async function onPhotoRemove() {
    setPhotoLoading(true);
    try {
      const res = await fetch(`/api/admin/team/${member.id}/photo`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Não foi possível remover a foto.");
        return;
      }
      setPhotoUrl(null);
      toast.success("Foto removida.");
      router.refresh();
    } finally {
      setPhotoLoading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/team/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          ...(isLinked ? {} : { name }),
          ...(colorTouched ? { colorVar: color } : {}),
          birthDate: birthDate || null,
          hireDate: hireDate || null,
          address: address.trim() || null,
          email: email.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Não foi possível salvar.");
        return;
      }
      toast.success("Pessoa atualizada.");
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function onDelete() {
    if (
      !confirm(
        `Remover ${member.name} da equipe? Isso desvincula clientes e squads associados a ela${isLinked ? ", mas não exclui a conta em Administração" : ""}. Esta ação não pode ser desfeita.`
      )
    )
      return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/team/${member.id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Não foi possível remover.");
        return;
      }
      toast.success("Removido da equipe.");
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Pencil className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar pessoa</DialogTitle>
          <DialogDescription>
            {isLinked ? "Cargo e cor usados em Clientes, SLA e Ekyte." : "Atualiza o perfil usado em Clientes, SLA e Ekyte."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="team-name">Nome</Label>
            {isLinked ? (
              <>
                <Input id="team-name" value={member.name} disabled />
                <p className="text-xs text-muted-2">Gerenciado em Administração &gt; Usuários.</p>
              </>
            ) : (
              <Input id="team-name" required value={name} onChange={(e) => setName(e.target.value)} />
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="team-role">Função</Label>
            <Input id="team-role" required placeholder="Ex: Gestor de Tráfego" value={role} onChange={(e) => setRole(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="team-birth">Aniversário</Label>
              <Input id="team-birth" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="team-hire">Contratação</Label>
              <Input id="team-hire" type="date" value={hireDate} onChange={(e) => setHireDate(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="team-email">E-mail</Label>
            <Input id="team-email" type="email" placeholder="pessoa@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="team-address">Endereço</Label>
            <Input id="team-address" placeholder="Rua, número, cidade" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Foto de perfil</Label>
            <div className="flex items-center gap-3">
              <TeamAvatar id={member.id} name={member.name} colorVar={color} photoUrl={photoUrl} cacheBust={photoVersion} className="size-14" />
              <div className="flex flex-col gap-1.5">
                <label>
                  <Button type="button" variant="outline" size="sm" disabled={photoLoading} asChild>
                    <span>
                      {photoLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
                      Importar foto
                    </span>
                  </Button>
                  <input type="file" accept="image/png,image/jpeg,image/webp" onChange={onPhotoSelected} disabled={photoLoading} className="hidden" />
                </label>
                {photoUrl && (
                  <button
                    type="button"
                    onClick={onPhotoRemove}
                    disabled={photoLoading}
                    className="text-left text-xs text-muted hover:text-negative"
                  >
                    Remover foto
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="team-color">Cor</Label>
            <input
              id="team-color"
              type="color"
              value={color}
              onChange={(e) => {
                setColor(e.target.value);
                setColorTouched(true);
              }}
              className="h-9 w-16 cursor-pointer rounded-lg border border-border bg-surface p-1"
            />
          </div>
          <DialogFooter className="items-center justify-between sm:justify-between">
            <Button type="button" variant="ghost" onClick={onDelete} disabled={loading} className="text-negative hover:bg-negative-soft">
              <Trash2 className="size-4" /> Remover da equipe
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
