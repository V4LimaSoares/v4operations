import Image from "next/image";
import { ShieldOff } from "lucide-react";
import { requireUser, clearSessionCookie } from "@/lib/session";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function SemPermissaoPage() {
  const user = await requireUser();

  async function logout() {
    "use server";
    await clearSessionCookie();
    const { redirect } = await import("next/navigation");
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm p-8 text-center">
        <div className="mb-6 flex flex-col items-center gap-3">
          <Image src="/brand/v4-logo.png" alt="V4" width={40} height={40} priority />
          <ShieldOff className="size-8 text-muted-2" />
        </div>
        <h1 className="text-lg font-semibold">Sem permissão de acesso</h1>
        <p className="mt-2 text-sm text-muted">
          Olá, {user.name}. Sua conta ainda não tem acesso a nenhuma área do sistema. Peça a um administrador
          para liberar as permissões necessárias.
        </p>
        <form action={logout} className="mt-6">
          <Button type="submit" variant="outline" className="w-full">
            Sair
          </Button>
        </form>
      </Card>
    </div>
  );
}
