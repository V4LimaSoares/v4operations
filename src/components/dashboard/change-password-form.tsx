"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export function ChangePasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (next !== confirm) {
      toast.error("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Não foi possível alterar a senha.");
        return;
      }
      toast.success("Senha alterada com sucesso.");
      setCurrent("");
      setNext("");
      setConfirm("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 max-w-sm">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="current">Senha atual</Label>
        <Input id="current" type="password" required value={current} onChange={(e) => setCurrent(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="next">Nova senha</Label>
        <Input id="next" type="password" required minLength={8} value={next} onChange={(e) => setNext(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirm">Confirmar nova senha</Label>
        <Input id="confirm" type="password" required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </div>
      <Button type="submit" disabled={loading} className="w-fit">
        {loading && <Loader2 className="size-4 animate-spin" />}
        Alterar senha
      </Button>
    </form>
  );
}
