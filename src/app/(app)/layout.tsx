import { requireUser } from "@/lib/session";
import { listClientOptions } from "@/lib/scope";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "V4 Lima Soares - Performance";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const clients = user.role === "ADMIN" ? await listClientOptions() : undefined;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar role={user.role} appName={APP_NAME} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          appName={APP_NAME}
          user={{ name: user.name, email: user.email, role: user.role }}
          clients={clients}
        />
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="mx-auto max-w-[1600px] p-4 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
