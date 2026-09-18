"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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

export type PermissionProfileOption = { id: string; name: string; modules: string[] };
export type UnlinkedTeamMember = { id: string; name: string; role: string };

export type EditableUser = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "STAFF";
  active: boolean;
  modulePermissions: string[];
  permissionProfileId: string | null;
};

const MODULE_GROUPS = Array.from(new Set(MODULES.map((m) => m.group)));

export function UserDialog({
  user,
  profiles,
  isSelf,
  unlinkedTeamMembers = [],
}: {
  user?: EditableUser;
  profiles: PermissionProfileOption[];
  isSelf?: boolean;
  /** Equipes profiles with no account yet — lets "Novo usuário" link to one of them instead of
   *  Equipes creating a duplicate later. Only meaningful when creating (not editing). */
  unlinkedTeamMembers?: UnlinkedTeamMember[];
}) {
  const router = useRouter();
  const isEdit = !!user;
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [role, setRole] = useState<"ADMIN" | "STAFF">(user?.role ?? "STAFF");
  const [active, setActive] = useState(user?.active ?? true);
  const [profileId, setProfileId] = useState<string>(user?.permissionProfileId ?? "");
  const [modules, setModules] = useState<Set<string>>(new Set(user?.modulePermissions ?? []));
  const [password, setPassword] = useState("");
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  // Post-create shortcut (item 5 of the Equipes/Administração flow) — offered only right after
  // creating a brand-new user, never on edit. Doesn't change who owns what: it just calls the
  // same "link an existing user" endpoint Equipes' own "Adicionar membro" uses.
  const [createdUser, setCreatedUser] = useState<{ id: string; name: string } | null>(null);
  const [addingToTeam, setAddingToTeam] = useState(false);
  // "Essa pessoa já é um membro da equipe?" — create-only. Answering "sim" links the new account
  // to an existing (accountless) Equipes profile instead of letting one get created later, which
  // would otherwise duplicate the person (e.g. a second "Mônica Betim").
  const [alreadyMember, setAlreadyMember] = useState(false);
  const [selectedTeamMemberId, setSelectedTeamMemberId] = useState("");
  const [skipTeamPrompt, setSkipTeamPrompt] = useState(false);

  const profileMap = useMemo(() => new Map(profiles.map((p) => [p.id, p])), [profiles]);

  function applyProfile(id: string) {
    setProfileId(id);
    const profile = profileMap.get(id);
    if (profile) setModules(new Set(profile.modules));
  }

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
      const payload = {
        name,
        email,
        role,
        active,
        permissionProfileId: profileId || null,
        modulePermissions: Array.from(modules),
        ...(password && { password }),
      };
      const res = await fetch(isEdit ? `/api/admin/users/${user!.id}` : "/api/admin/users", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Não foi possível salvar.");
        return;
      }

      let didLinkExisting = false;
      if (!isEdit) {
        setCreatedUser({ id: data.user.id, name: data.user.name });
        if (alreadyMember && selectedTeamMemberId) {
          const linkRes = await fetch(`/api/admin/team/${selectedTeamMemberId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: data.user.id }),
          });
          if (linkRes.ok) {
            toast.success("Conta vinculada ao perfil de equipe existente.");
            didLinkExisting = true;
          } else {
            const linkData = await linkRes.json().catch(() => ({}));
            toast.error(linkData.error ?? "Usuário criado, mas não foi possível vincular à equipe.");
          }
        }
      }

      if (data.generatedPassword) {
        setSkipTeamPrompt(didLinkExisting);
        setGeneratedPassword(data.generatedPassword);
        return;
      }
      if (!isEdit && !didLinkExisting) return; // shows the "add to team?" prompt next, see render below
      finish();
    } finally {
      setLoading(false);
    }
  }

  async function addToTeam() {
    if (!createdUser) return;
    setAddingToTeam(true);
    try {
      const res = await fetch("/api/admin/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: createdUser.name, userId: createdUser.id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Não foi possível adicionar à equipe.");
        return;
      }
      toast.success("Adicionado à equipe — ajuste cargo e cor em Equipes.");
      finish();
    } finally {
      setAddingToTeam(false);
    }
  }

  function finish() {
    setOpen(false);
    setGeneratedPassword(null);
    setCreatedUser(null);
    setPassword("");
    setAlreadyMember(false);
    setSelectedTeamMemberId("");
    setSkipTeamPrompt(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : finish())}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="ghost" size="sm">
            <Pencil className="size-3.5" /> Editar
          </Button>
        ) : (
          <Button>
            <Plus className="size-4" /> Novo usuário
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto scrollbar-thin">
        {generatedPassword ? (
          <>
            <DialogHeader>
              <DialogTitle>Usuário criado</DialogTitle>
              <DialogDescription>Compartilhe estas credenciais — a senha só é exibida uma vez.</DialogDescription>
            </DialogHeader>
            <div className="rounded-lg bg-surface-2 p-4 text-sm">
              <p><span className="text-muted">E-mail:</span> <span className="font-medium">{email}</span></p>
              <p className="mt-1"><span className="text-muted">Senha:</span> <span className="font-mono font-medium">{generatedPassword}</span></p>
            </div>
            <DialogFooter>
              <Button onClick={() => (skipTeamPrompt ? finish() : setGeneratedPassword(null))}>Concluir</Button>
            </DialogFooter>
          </>
        ) : createdUser ? (
          <>
            <DialogHeader>
              <DialogTitle>Usuário criado com sucesso</DialogTitle>
              <DialogDescription>Deseja adicionar {createdUser.name} a uma equipe agora?</DialogDescription>
            </DialogHeader>
            <DialogFooter className="justify-end gap-2">
              <Button variant="ghost" onClick={finish} disabled={addingToTeam}>
                Fazer depois
              </Button>
              <Button onClick={addToTeam} disabled={addingToTeam}>
                {addingToTeam && <Loader2 className="size-4 animate-spin" />}
                Adicionar à equipe
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{isEdit ? `Editar · ${user!.name}` : "Novo usuário"}</DialogTitle>
              <DialogDescription>
                Contas internas da equipe. Para criar login de cliente, use a tela de Clientes.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={onSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="name">Nome</Label>
                  <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={isEdit} />
                </div>
              </div>

              {!isEdit && (
                <div className="rounded-lg border border-border p-3">
                  <Label>Essa pessoa já é um membro da equipe (Equipes)?</Label>
                  <div className="mt-2 flex gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="already-member"
                        checked={!alreadyMember}
                        onChange={() => {
                          setAlreadyMember(false);
                          setSelectedTeamMemberId("");
                        }}
                      />
                      Não — é nova
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="radio" name="already-member" checked={alreadyMember} onChange={() => setAlreadyMember(true)} />
                      Sim — já está em Equipes
                    </label>
                  </div>
                  {alreadyMember && (
                    <div className="mt-3 flex flex-col gap-1.5">
                      <Label>Selecione a pessoa em Equipes</Label>
                      {unlinkedTeamMembers.length === 0 ? (
                        <p className="text-sm text-muted">Nenhum perfil de Equipes sem conta vinculada no momento.</p>
                      ) : (
                        <Select required value={selectedTeamMemberId} onChange={(e) => setSelectedTeamMemberId(e.target.value)}>
                          <option value="">Selecione…</option>
                          {unlinkedTeamMembers.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} — {m.role}
                            </option>
                          ))}
                        </Select>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label>Papel</Label>
                  <Select
                    value={role}
                    disabled={isSelf}
                    onChange={(e) => setRole(e.target.value as "ADMIN" | "STAFF")}
                  >
                    <option value="STAFF">Equipe (permissões definidas abaixo)</option>
                    <option value="ADMIN">Administrador (acesso total)</option>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Senha {isEdit && <span className="text-muted-2">(deixe em branco para manter)</span>}</Label>
                  <Input
                    type="password"
                    placeholder={isEdit ? "••••••••" : "gerar automaticamente"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={8}
                  />
                </div>
              </div>

              {isEdit && (
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <div className="text-sm font-medium">Conta ativa</div>
                    <div className="text-xs text-muted">Desativar bloqueia o acesso imediatamente.</div>
                  </div>
                  <Switch checked={active} disabled={isSelf} onCheckedChange={setActive} />
                </div>
              )}

              {role === "STAFF" && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <Label>Aplicar perfil (opcional — pré-preenche os módulos abaixo)</Label>
                    <Select value={profileId} onChange={(e) => applyProfile(e.target.value)}>
                      <option value="">— nenhum, escolher manualmente —</option>
                      {profiles.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <Label>Módulos liberados para este usuário</Label>
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
                </>
              )}

              {role === "ADMIN" && (
                <p className="rounded-lg bg-info-soft px-3 py-2 text-sm text-info">
                  Administradores têm acesso irrestrito a todas as áreas — não é necessário selecionar módulos.
                </p>
              )}

              <DialogFooter>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="size-4 animate-spin" />}
                  {isEdit ? "Salvar alterações" : "Criar usuário"}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
