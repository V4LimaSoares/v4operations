"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

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

  const inputCls =
    "h-11 border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400 focus-visible:ring-primary/40";

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <Image src="/brand/v4-logo.png" alt="V4" width={52} height={52} priority />
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Bem-vindo!</h1>
          <p className="mt-1 text-sm text-neutral-500">V4 Company - Operations</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email" className="text-neutral-800">
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
            className={inputCls}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password" className="text-neutral-800">
            Senha
          </Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className={inputCls}
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <Button type="submit" disabled={loading} className="mt-2 h-11 w-full text-base">
          {loading && <Loader2 className="size-4 animate-spin" />}
          Entrar
        </Button>

        <Link href="/esqueci-senha" className="text-center text-sm text-primary hover:underline">
          Esqueci minha senha
        </Link>
      </form>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-neutral-200" />
        <span className="text-xs text-neutral-400">ou</span>
        <div className="h-px flex-1 bg-neutral-200" />
      </div>

      <Button
        type="button"
        variant="outline"
        className="h-11 w-full border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50"
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
        <p className="mt-3 text-center text-xs text-neutral-500">
          Login com Google chega em breve — por enquanto, use e-mail e senha.
        </p>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen bg-white">
      <div className="flex w-full flex-col items-center justify-center px-6 py-10 lg:w-[42%] lg:min-w-[420px]">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>

      <div className="relative hidden flex-1 bg-black lg:block" aria-hidden>
        <Image
          src="/brand/login-art.webp"
          alt=""
          fill
          priority
          sizes="58vw"
          className="object-cover object-center"
        />
      </div>
    </div>
  );
}
