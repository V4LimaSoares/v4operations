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
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/use-theme";

/** Same account menu as the topbar's UserMenu, docked at the bottom of the desktop sidebar instead
 *  (the topbar version stays around only for mobile, where this sidebar isn't rendered at all). */
export function SidebarUserMenu({
  name,
  email,
  role,
  fadeClassName,
  onRed = false,
}: {
  name: string;
  email: string;
  role: "ADMIN" | "STAFF" | "CLIENT";
  fadeClassName: string;
  /** The floating sidebar card is solid brand red — swaps the trigger row's colors for
   *  white-on-red instead of the app's usual surface/foreground pair. The popover menu itself
   *  stays themed normally; it floats over the page, not over the red card. */
  onRed?: boolean;
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
    <div className={cn("shrink-0 p-3", onRed ? "border-t border-white/15" : "border-t border-border")}>
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "flex w-full items-center gap-3 rounded-lg p-1.5 text-left transition-colors",
            onRed ? "hover:bg-white/10" : "hover:bg-surface-2"
          )}
        >
          <div
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
              onRed ? "bg-white/20 text-white" : "bg-primary-soft text-primary"
            )}
          >
            {initials || <UserIcon className="size-3.5" />}
          </div>
          <div className={cn("min-w-0 flex-1", fadeClassName)}>
            <div className={cn("truncate text-sm font-medium", onRed ? "text-white" : "text-foreground")}>{name}</div>
            <div className={cn("truncate text-xs", onRed ? "text-white/60" : "text-muted-2")}>{email}</div>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="top" className="w-64">
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
    </div>
  );
}
