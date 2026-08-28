"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [devUrl, setDevUrl] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setMessage(data.message ?? "Se o e-mail existir, um link foi gerado.");
      setDevUrl(data.devResetUrl ?? null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm p-8">
        <Link href="/login" className="mb-6 inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground">
          <ArrowLeft className="size-3.5" /> Voltar para login
        </Link>
        <h1 className="text-lg font-semibold">Esqueci minha senha</h1>
        <p className="mt-1 text-sm text-muted">
          Informe seu e-mail para receber um link de redefinição.
        </p>

        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@empresa.com"
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            Enviar link
          </Button>
        </form>

        {message && (
          <div className="mt-4 rounded-lg bg-info-soft px-3 py-2 text-sm text-info">
            {message}
          </div>
        )}
        {devUrl && (
          <div className="mt-2 rounded-lg border border-dashed border-warning/50 bg-warning-soft px-3 py-2 text-xs text-warning">
            Envio de e-mail ainda não configurado (defina <code>RESEND_API_KEY</code>). Link de
            teste:{" "}
            <Link href={devUrl} className="underline break-all">
              {devUrl}
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
}
