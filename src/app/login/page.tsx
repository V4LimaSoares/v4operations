"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleNotice, setGoogleNotice] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Não foi possível entrar.");
        return;
      }
      router.push(next);
      router.refresh();
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-sm border-white/15 bg-white/[0.07] p-8 shadow-2xl shadow-black/50 backdrop-blur-2xl">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <Image src="/brand/v4-logo.png" alt="V4" width={44} height={44} priority />
        <div>
          <h1 className="text-lg font-semibold text-white">V4 Company - Operations</h1>
          <p className="text-sm text-white/60">Entre com suas credenciais para continuar</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email" className="text-white/80">
            E-mail
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@empresa.com"
            className="border-white/15 bg-white/5 text-white placeholder:text-white/35 focus-visible:ring-primary/60"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-white/80">
              Senha
            </Label>
            <Link href="/esqueci-senha" className="text-xs text-primary hover:underline">
              Esqueci minha senha
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="border-white/15 bg-white/5 text-white placeholder:text-white/35 focus-visible:ring-primary/60"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-negative-soft px-3 py-2 text-sm text-negative">{error}</p>
        )}

        <Button type="submit" disabled={loading} className="mt-2 w-full">
          {loading && <Loader2 className="size-4 animate-spin" />}
          Entrar
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-white/15" />
        <span className="text-xs text-white/45">ou</span>
        <div className="h-px flex-1 bg-white/15" />
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full border-white/15 bg-white/5 text-white hover:bg-white/10"
        onClick={() => setGoogleNotice(true)}
      >
        <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
          <path
            fill="#4285F4"
            d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3.02h3.88c2.27-2.09 3.57-5.17 3.57-8.84Z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.96-1.07 7.95-2.9l-3.88-3.02c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.26v3.11A11.998 11.998 0 0 0 12 24Z"
          />
          <path
            fill="#FBBC05"
            d="M5.27 14.27a7.2 7.2 0 0 1 0-4.54V6.62H1.26a12 12 0 0 0 0 10.76l4.01-3.11Z"
          />
          <path
            fill="#EA4335"
            d="M12 4.77c1.76 0 3.35.6 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.4 0 3.41 2.61 1.26 6.62l4.01 3.11C6.22 6.88 8.87 4.77 12 4.77Z"
          />
        </svg>
        Entrar com o Google
      </Button>
      {googleNotice && (
        <p className="mt-3 text-center text-xs text-white/50">
          Login com Google chega em breve — por enquanto, use e-mail e senha.
        </p>
      )}
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <Image
        src="/brand/login-bg.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      {/* Vignette: darker at the edges for contrast with the card, lighter behind it so the
          red hallway photo still reads through the glass instead of going muddy. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.55)_75%)]" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/50" />

      <div className="relative z-10">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
