"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";

export function NewAccountDialog({ clients }: { clients: { id: string; name: string; company: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [platform, setPlatform] = useState<"GOOGLE_ADS" | "META_ADS">("GOOGLE_ADS");
  const [externalId, setExternalId] = useState("");
  const [name, setName] = useState("");
  const [dataSource, setDataSource] = useState<"DEMO" | "REAL">("REAL");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/ad-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, platform, externalId, name, dataSource }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Não foi possível conectar a conta.");
        return;
      }
      toast.success("Conta conectada.");
      setOpen(false);
      setExternalId("");
      setName("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" /> Conectar conta
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Conectar conta de anúncios</DialogTitle>
          <DialogDescription>
            Informe o ID da conta (customer_id do Google Ads ou act_&#123;id&#125; do Meta Ads) — descoberto via os
            MCPs de Google Ads / Meta Ads em uma sessão do Claude Code — e associe a um cliente.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="client">Cliente</Label>
            <Select id="client" required value={clientId} onChange={(e) => setClientId(e.target.value)}>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.company}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="platform">Plataforma</Label>
            <Select id="platform" value={platform} onChange={(e) => setPlatform(e.target.value as "GOOGLE_ADS" | "META_ADS")}>
              <option value="GOOGLE_ADS">Google Ads</option>
              <option value="META_ADS">Meta Ads</option>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="externalId">ID da conta</Label>
            <Input
              id="externalId"
              required
              value={externalId}
              onChange={(e) => setExternalId(e.target.value)}
              placeholder={platform === "GOOGLE_ADS" ? "1234567890" : "act_1234567890"}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Nome da conta</Label>
            <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dataSource">Origem dos dados</Label>
            <Select id="dataSource" value={dataSource} onChange={(e) => setDataSource(e.target.value as "DEMO" | "REAL")}>
              <option value="REAL">Real (sincronizado via MCP)</option>
              <option value="DEMO">Demo (dados fictícios para demonstração)</option>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading || !clientId}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              Conectar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
