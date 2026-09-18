"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LogOut, Settings, Sun, Moon, Check, User as UserIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/use-theme";

export function UserMenu({
  name,
  email,
  role,
}: {
  name: string;
  email: string;
  role: "ADMIN" | "STAFF" | "CLIENT";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { theme, setTheme } = useTheme();

  function logout() {
    startTransition(async () => {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    });
  }

  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg border border-border bg-surface px-2 py-1.5 text-sm hover:bg-surface-2">
        <div className="flex size-7 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
          {initials || <UserIcon className="size-3.5" />}
        </div>
        <span className="hidden max-w-32 truncate font-medium sm:inline">{name}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          <div className="flex flex-col gap-1">
            <span className="font-medium text-foreground">{name}</span>
            <span className="truncate text-muted-2">{email}</span>
            <Badge variant={role === "ADMIN" ? "primary" : role === "STAFF" ? "info" : "outline"} className="mt-1 w-fit">
              {role === "ADMIN" ? "Administrador" : role === "STAFF" ? "Equipe" : "Cliente"}
            </Badge>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => setTheme("light")}>
          <Sun className="size-4" />
          Modo claro
          {theme === "light" && <Check className="ml-auto size-3.5" />}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setTheme("dark")}>
          <Moon className="size-4" />
          Modo escuro
          {theme === "dark" && <Check className="ml-auto size-3.5" />}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push("/configuracoes")}>
          <Settings className="size-4" />
          Configurações
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => router.push("/perfil")}>
          <UserIcon className="size-4" />
          Perfil
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={logout} disabled={pending} className="text-negative">
          <LogOut className="size-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
