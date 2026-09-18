"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, KeyRound } from "lucide-react";
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

export function EkyteTokenDialog({ trigger }: { trigger: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/ekyte/api-key", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Token salvo, mas ainda não está funcionando.");
        return;
      }
      toast.success("Token atualizado e funcionando.");
      setOpen(false);
      setApiKey("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Atualizar token do Ekyte</DialogTitle>
          <DialogDescription>
            Gere um novo em Ekyte &gt; Minha Empresa &gt; Data Driven &gt; Token de acesso, e cole aqui. Testamos na hora.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ekyte-token">Token de acesso</Label>
            <Input
              id="ekyte-token"
              required
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Cole o token aqui"
              autoComplete="off"
            />
          </div>
          {error && <p className="text-sm text-negative">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={loading || !apiKey.trim()}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
              Salvar e testar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
