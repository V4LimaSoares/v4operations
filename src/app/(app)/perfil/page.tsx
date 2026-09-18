import Link from "next/link";
import { Users, UserRound, ClipboardList, RefreshCw, User as UserIcon } from "lucide-react";
import { requireUser } from "@/lib/session";
import { getProfileData } from "@/lib/data/profile";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PlatformBadge } from "@/components/dashboard/badges";
import { formatDate } from "@/lib/utils";

const NOTE_TYPE_VARIANT: Record<string, "info" | "warning" | "negative" | "default"> = {
  Reunião: "info",
  Decisão: "default",
  Risco: "negative",
  Observação: "warning",
};

// Deliberately not a repeat of Configurações (account fields + password): this is the person's
// footprint elsewhere in the app — their Equipes/Squad profile, and real activity they've
// generated — not a second copy of the same settings form.
export default async function PerfilPage() {
  const user = await requireUser();
  const { teamMemberProfile, notes, syncs, notesCount, syncsCount } = await getProfileData(user.id);

  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const handle = user.email.split("@")[0];

  return (
    <div>
      <PageHeader title="Perfil" description="Sua identidade e atividade neste portal" />

      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-4">
          <div
            className="flex size-16 shrink-0 items-center justify-center rounded-2xl text-xl font-bold text-white"
            style={{ background: teamMemberProfile?.colorVar || "var(--color-primary)" }}
          >
            {initials || <UserIcon className="size-6" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold">{user.name}</h2>
              <Badge variant={user.role === "ADMIN" ? "primary" : user.role === "STAFF" ? "info" : "outline"}>
                {user.role === "ADMIN" ? "Administrador" : user.role === "STAFF" ? "Equipe" : "Cliente"}
              </Badge>
            </div>
            <p className="text-sm text-muted">@{handle}</p>
            <p className="mt-1 text-xs text-muted-2">
              Membro desde {formatDate(user.createdAt)}
              {user.lastLoginAt && <> · Último acesso em {formatDate(user.lastLoginAt)}</>}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <ProfileStat icon={UserRound} label="Squads" value={teamMemberProfile?.squads.length ?? 0} />
          <ProfileStat icon={Users} label="Clientes vinculados" value={teamMemberProfile?._count.clients ?? 0} />
          <ProfileStat icon={ClipboardList} label="Notas registradas" value={notesCount} />
          <ProfileStat icon={RefreshCw} label="Syncs disparados" value={syncsCount} />
        </div>
      </Card>

      {teamMemberProfile && (
        <Card className="mt-6 p-5">
          <div className="mb-3 text-sm font-semibold">Sua equipe</div>
          {teamMemberProfile.squads.length === 0 ? (
            <p className="text-sm text-muted">Ainda não vinculado a nenhum squad.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {teamMemberProfile.squads.map((s) => (
                <Link
                  key={s.squad.id}
                  href={`/equipes/squad/${s.squad.id}`}
                  className="flex items-center gap-2 rounded-full border border-border bg-surface-2 px-3 py-1.5 text-sm hover:border-muted-2"
                >
                  {s.squad.name}
                  {s.role && <span className="text-xs text-muted">· {s.role}</span>}
                </Link>
              ))}
            </div>
          )}
        </Card>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Notas recentes</CardTitle>
            <CardDescription>Últimos registros seus no histórico de relacionamento dos clientes</CardDescription>
          </CardHeader>
          <CardContent>
            {notes.length === 0 ? (
              <EmptyState message="Nenhuma nota registrada ainda." />
            ) : (
              <div className="flex flex-col gap-3">
                {notes.map((n) => (
                  <div key={n.id} className="rounded-lg bg-surface-2 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={NOTE_TYPE_VARIANT[n.type] ?? "default"}>{n.type}</Badge>
                        <span className="text-xs text-muted">{n.client.name}</span>
                      </div>
                      <span className="shrink-0 text-xs text-muted-2">{formatDate(n.occurredAt)}</span>
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-sm text-foreground/90">{n.body}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Syncs disparados</CardTitle>
            <CardDescription>Últimas sincronizações de contas de anúncio que você iniciou</CardDescription>
          </CardHeader>
          <CardContent>
            {syncs.length === 0 ? (
              <EmptyState message="Nenhum sync disparado ainda." />
            ) : (
              <div className="flex flex-col gap-3">
                {syncs.map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-3 rounded-lg bg-surface-2 p-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <PlatformBadge platform={s.platform} />
                        <span className="truncate text-sm">{s.adAccount.name}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-2">
                        {formatDate(s.startedAt)}
                        {s.recordsSynced != null && <> · {s.recordsSynced} registros</>}
                      </p>
                    </div>
                    <Badge
                      variant={s.status === "SUCCESS" ? "positive" : s.status === "ERROR" ? "negative" : "warning"}
                      className="shrink-0"
                    >
                      {s.status === "SUCCESS" ? "Sucesso" : s.status === "ERROR" ? "Erro" : "Em andamento"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ProfileStat({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: number }) {
  return (
    <div className="rounded-lg bg-surface-2 p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted">
        <Icon className="size-3.5" /> {label}
      </div>
      <div className="mt-1 text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}
