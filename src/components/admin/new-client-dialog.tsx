"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";

type TeamOption = { id: string; name: string; colorVar: string };

export function NewClientDialog({ team = [] }: { team?: TeamOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [responsibleIds, setResponsibleIds] = useState<string[]>([]);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);

  function toggleResponsible(id: string) {
    setResponsibleIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, company, email }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Não foi possível criar o cliente.");
        return;
      }
      // Cliente + responsáveis num só passo: já vincula a equipe selecionada assim que o
      // cliente existe, sem depender de um segundo passo na aba Equipe do detalhe.
      if (responsibleIds.length > 0) {
        const clientId = data.client.id as string;
        await Promise.all(
          responsibleIds.map((teamMemberId) =>
            fetch(`/api/admin/clients/${clientId}/team`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ teamMemberId }),
            })
          )
        );
      }
      if (data.generatedPassword) {
        setGeneratedPassword(data.generatedPassword);
      } else {
        finish();
      }
    } finally {
      setLoading(false);
    }
  }

  function finish() {
    setOpen(false);
    setName("");
    setCompany("");
    setEmail("");
    setResponsibleIds([]);
    setGeneratedPassword(null);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : finish())}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" /> Novo cliente
        </Button>
      </DialogTrigger>
      <DialogContent>
        {generatedPassword ? (
          <>
            <DialogHeader>
              <DialogTitle>Cliente criado</DialogTitle>
              <DialogDescription>
                Compartilhe estas credenciais com o cliente — a senha só é exibida uma vez.
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-lg bg-surface-2 p-4 text-sm">
              <p><span className="text-muted">E-mail:</span> <span className="font-medium">{email}</span></p>
              <p className="mt-1"><span className="text-muted">Senha:</span> <span className="font-mono font-medium">{generatedPassword}</span></p>
            </div>
            <DialogFooter>
              <Button onClick={finish}>Concluir</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Novo cliente</DialogTitle>
              <DialogDescription>Cria a empresa e o usuário de acesso do portal do cliente.</DialogDescription>
            </DialogHeader>
            <form onSubmit={onSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Nome do contato</Label>
                <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="company">Empresa</Label>
                <Input id="company" required value={company} onChange={(e) => setCompany(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">E-mail de acesso</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              {team.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <Label>Responsáveis (opcional)</Label>
                  <div className="flex flex-wrap gap-2">
                    {team.map((m) => {
                      const active = responsibleIds.includes(m.id);
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => toggleResponsible(m.id)}
                          className={`flex items-center gap-1.5 rounded-full border py-1 pl-1 pr-2.5 text-sm transition-colors ${
                            active ? "border-primary bg-primary/10" : "border-border bg-surface-2 text-muted"
                          }`}
                        >
                          <span
                            className="flex size-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
                            style={{ background: m.colorVar }}
                          >
                            {m.name[0]}
                          </span>
                          {m.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="size-4 animate-spin" />}
                  Criar cliente
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
