import { Suspense } from "react";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ClientSwitcher } from "@/components/layout/client-switcher";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";

export function Topbar({
  appName,
  user,
  clients,
}: {
  appName: string;
  user: { name: string; email: string; role: "ADMIN" | "CLIENT" };
  clients?: { id: string; name: string; company: string }[];
}) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border bg-surface px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <MobileNav role={user.role} appName={appName} />
      </div>

      <div className="flex flex-1 items-center justify-end gap-3">
        {clients && (
          <Suspense fallback={<div className="h-9 w-56" />}>
            <ClientSwitcher clients={clients} />
          </Suspense>
        )}
        <ThemeToggle />
        <UserMenu name={user.name} email={user.email} role={user.role} />
      </div>
    </header>
  );
}
