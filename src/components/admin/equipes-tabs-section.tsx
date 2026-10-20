"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Users } from "lucide-react";
import { TeamMemberDialog, type AvailableUser } from "@/components/admin/team-member-dialog";
import { TeamAvatar } from "@/components/admin/team-avatar";
import { SquadDialog } from "@/components/admin/squad-dialog";
import { SquadCard, type SquadCardData } from "@/components/admin/squad-card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

type TeamMemberRow = {
  id: string;
  name: string;
  role: string;
  colorVar: string;
  photoUrl: string | null;
  active: boolean;
  userId: string | null;
  birthDate: Date | string | null;
  hireDate: Date | string | null;
  address: string | null;
  email: string | null;
  phone: string | null;
  _count: { clients: number };
};

/** Header action swaps between "Adicionar membro" and "Adicionar squad" depending on which tab
 *  is active — a single client component owns both the tab state and the header button so they
 *  can share it, instead of the (static, server-rendered) PageHeader guessing. */
export function EquipesTabsSection({
  team,
  squadCards,
  availableUsers,
  isAdmin,
  ownMemberId,
}: {
  team: TeamMemberRow[];
  squadCards: SquadCardData[];
  availableUsers: AvailableUser[];
  /** Admin: full control. Others: edit only their own profile; squads and new members are admin-only. */
  isAdmin: boolean;
  ownMemberId: string | null;
}) {
  const searchParams = useSearchParams();
  const [tab, setTabState] = useState(["squad", "alocacao"].includes(searchParams.get("tab") ?? "") ? (searchParams.get("tab") as string) : "equipes");
  const setTab = (v: string) => {
    setTabState(v);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", v);
    window.history.replaceState(window.history.state, "", url);
  };

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Equipes</h1>
          <p className="mt-1 text-sm text-muted">
            A equipe da agência — a mesma base para Performance, Controle de SLA, Health Score e Ekyte
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && tab === "equipes" && <TeamMemberDialog availableUsers={availableUsers} />}
          {isAdmin && tab === "squad" && <SquadDialog />}
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="equipes">Equipes</TabsTrigger>
          <TabsTrigger value="squad">Squad</TabsTrigger>
          <TabsTrigger value="alocacao">Alocação</TabsTrigger>
        </TabsList>

        <TabsContent value="equipes">
          {team.length === 0 ? (
            <Card>
              <EmptyState message="Nenhuma pessoa cadastrada ainda." />
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {team.map((m) => (
                <Card
                  key={m.id}
                  className="relative h-full overflow-hidden p-5 transition-all hover:-translate-y-0.5 hover:border-muted-2 hover:shadow-lg"
                >
                  {(isAdmin || m.id === ownMemberId) && (
                  <div className="absolute right-3 top-3">
                    <TeamMemberDialog
                      selfOnly={!isAdmin}
                      member={{
                        id: m.id,
                        name: m.name,
                        role: m.role,
                        colorVar: m.colorVar,
                        photoUrl: m.photoUrl,
                        userId: m.userId,
                        birthDate: m.birthDate,
                        hireDate: m.hireDate,
                        address: m.address,
                        email: m.email,
                        phone: m.phone,
                      }}
                    />
                  </div>
                  )}
                  <Link href={`/equipes/${m.id}`} className="block">
                    <div className="flex items-center justify-between pr-8">
                      <TeamAvatar id={m.id} name={m.name} colorVar={m.colorVar} photoUrl={m.photoUrl} />
                      {!m.active && (
                        <Badge variant="negative" className="shrink-0">
                          Inativo
                        </Badge>
                      )}
                    </div>
                    <div className="mt-3.5 text-sm font-semibold">{m.name}</div>
                    <div className="mt-0.5 text-xs text-muted">{m.role}</div>
                    <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 text-xs text-muted">
                      <Users className="size-3.5" />
                      {m._count.clients} cliente{m._count.clients === 1 ? "" : "s"}
                    </div>
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="alocacao">
          <AllocationView team={team} squadCards={squadCards} />
        </TabsContent>

        <TabsContent value="squad">
          {squadCards.length === 0 ? (
            <Card>
              <EmptyState message="Nenhum squad cadastrado ainda." />
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {squadCards.map((s) => (
                <SquadCard key={s.id} squad={s} canEdit={isAdmin} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}


/** Distribuição de clientes por pessoa e por squad — mesmos dados do cadastro, só reordenados para
 *  responder "quem está sobrecarregado?". Sobrecarga = acima de 1,5× a média das pessoas ativas
 *  com ao menos um cliente (limiar simples e explícito, não uma meta de capacidade). */
function AllocationView({ team, squadCards }: { team: TeamMemberRow[]; squadCards: SquadCardData[] }) {
  const active = team.filter((m) => m.active);
  const withClients = active.filter((m) => m._count.clients > 0);
  const avg = withClients.length ? withClients.reduce((a, m) => a + m._count.clients, 0) / withClients.length : 0;
  const max = Math.max(1, ...active.map((m) => m._count.clients));
  const squadsOf = (id: string) => squadCards.filter((s) => s.members.some((m) => m.id === id)).map((s) => s.name);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="p-5 lg:col-span-2">
        <div className="mb-1 text-sm font-semibold">Clientes por pessoa</div>
        <p className="mb-4 text-xs text-muted">Média: {avg.toFixed(1)} clientes por pessoa com carteira. “Alta carga” = acima de 1,5× a média.</p>
        <div className="flex flex-col gap-3">
          {[...active].sort((a, b) => b._count.clients - a._count.clients).map((m) => {
            const n = m._count.clients;
            const heavy = avg > 0 && n > avg * 1.5;
            return (
              <Link key={m.id} href={`/equipes/${m.id}`} className="block">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">
                    {m.name} <span className="text-xs font-normal text-muted">· {m.role}</span>
                  </span>
                  <span className="flex items-center gap-2 tabular-nums">
                    {heavy && <Badge variant="warning">Alta carga</Badge>}
                    {n}
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-border">
                  <div className={heavy ? "h-full rounded-full bg-warning" : "h-full rounded-full bg-primary"} style={{ width: `${(n / max) * 100}%` }} />
                </div>
                {squadsOf(m.id).length > 0 && <div className="mt-1 text-[11px] text-muted-2">{squadsOf(m.id).join(" · ")}</div>}
              </Link>
            );
          })}
        </div>
      </Card>
      <Card className="p-5">
        <div className="mb-3 text-sm font-semibold">Por squad</div>
        <div className="flex flex-col gap-3">
          {squadCards.map((s) => (
            <Link key={s.id} href={`/equipes/squad/${s.id}`} className="rounded-lg bg-surface-2 p-3 text-sm hover:bg-surface-2/70">
              <div className="font-medium">{s.name}</div>
              <div className="mt-1 text-xs text-muted">
                {s.members.length} pessoa{s.members.length === 1 ? "" : "s"} · {s.clientCount} cliente{s.clientCount === 1 ? "" : "s"}
                {s.members.length > 0 ? ` · ${(s.clientCount / s.members.length).toFixed(1)} por pessoa` : ""}
              </div>
              <div className="mt-1 text-xs text-muted">
                {s.tasks.overdue} tarefa(s) atrasada(s) · {s.sla.urgent} urgente(s) em SLA
              </div>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
