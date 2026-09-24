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
  _count: { clients: number };
};

/** Header action swaps between "Adicionar membro" and "Adicionar squad" depending on which tab
 *  is active — a single client component owns both the tab state and the header button so they
 *  can share it, instead of the (static, server-rendered) PageHeader guessing. */
export function EquipesTabsSection({
  team,
  squadCards,
  availableUsers,
}: {
  team: TeamMemberRow[];
  squadCards: SquadCardData[];
  availableUsers: AvailableUser[];
}) {
  const searchParams = useSearchParams();
  const [tab, setTabState] = useState(searchParams.get("tab") === "squad" ? "squad" : "equipes");
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
          {tab === "equipes" ? <TeamMemberDialog availableUsers={availableUsers} /> : <SquadDialog />}
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="equipes">Equipes</TabsTrigger>
          <TabsTrigger value="squad">Squad</TabsTrigger>
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
                  <div className="absolute right-3 top-3">
                    <TeamMemberDialog
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
                      }}
                    />
                  </div>
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

        <TabsContent value="squad">
          {squadCards.length === 0 ? (
            <Card>
              <EmptyState message="Nenhum squad cadastrado ainda." />
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {squadCards.map((s) => (
                <SquadCard key={s.id} squad={s} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}
