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
  user: { name: string; email: string; role: "ADMIN" | "STAFF" | "CLIENT"; modulePermissions: string[] };
  clients?: { id: string; name: string; company: string }[];
}) {
  return (
    <header className="relative z-20 flex h-16 shrink-0 items-center justify-between gap-3 px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <MobileNav role={user.role} appName={appName} modulePermissions={user.modulePermissions} />
      </div>

      <div className="flex flex-1 items-center justify-end gap-3">
        {clients && (
          <Suspense fallback={<div className="h-9 w-56" />}>
            <ClientSwitcher clients={clients} />
          </Suspense>
        )}
        <ThemeToggle />
        {/* Desktop shows the account menu docked at the bottom of the sidebar instead — this stays
            only for mobile/tablet, where that sidebar isn't rendered at all. */}
        <div className="lg:hidden">
          <UserMenu name={user.name} email={user.email} role={user.role} />
        </div>
      </div>
    </header>
  );
}
