import Image from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Wallet, Percent, ListChecks, ShieldAlert, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SquadRowActions } from "@/components/admin/squad-row-actions";
import { formatBRL, formatPercent } from "@/lib/utils";

export type SquadCardData = {
  id: string;
  name: string;
  logoUrl: string | null;
  members: { id: string; name: string; colorVar: string; role: string | null }[];
  clientCount: number;
  mrrBrl: number;
  avgChurnPct: number | null;
  tasks: { total: number; open: number; overdue: number; done: number };
  sla: { attention: number; urgent: number };
};

export function SquadCard({ squad }: { squad: SquadCardData }) {
  return (
    <Card className="relative h-full overflow-hidden p-5 transition-all hover:-translate-y-0.5 hover:border-muted-2 hover:shadow-lg">
      <div className="absolute right-3 top-3">
        <SquadRowActions squad={{ id: squad.id, name: squad.name, logoUrl: squad.logoUrl }} />
      </div>
      <Link href={`/equipes/squad/${squad.id}`} className="block">
        <div className="flex items-center gap-3 pr-8">
          {squad.logoUrl ? (
            <Image
              src={squad.logoUrl}
              alt=""
              width={48}
              height={48}
              className="size-12 shrink-0 rounded-xl shadow-[0_4px_16px_-4px_rgba(0,0,0,0.35)]"
            />
          ) : (
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-lg font-bold text-primary">
              {squad.name[0]}
            </div>
          )}
          <span className="text-base font-semibold">{squad.name}</span>
        </div>

        {squad.members.length === 0 ? (
          <p className="mt-3 text-xs text-muted-2">Nenhuma pessoa vinculada ainda.</p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {squad.members.map((m) => (
              <span
                key={m.id}
                title={m.role ?? undefined}
                className="flex items-center gap-1.5 rounded-full border border-border bg-surface-2 py-0.5 pl-0.5 pr-2 text-xs"
              >
                <span
                  className="flex size-4 items-center justify-center rounded-full text-[9px] font-bold text-white"
                  style={{ background: m.colorVar }}
                >
                  {m.name[0]}
                </span>
                {m.name}
              </span>
            ))}
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <SquadStat icon={Wallet} label="MRR" value={formatBRL(squad.mrrBrl)} />
          <SquadStat icon={Percent} label="Churn" value={squad.avgChurnPct != null ? formatPercent(squad.avgChurnPct) : "—"} />
          <SquadStat icon={ListChecks} label="Tarefas abertas" value={String(squad.tasks.open)} />
          <SquadStat icon={ShieldAlert} label="Alertas SLA" value={String(squad.sla.attention + squad.sla.urgent)} />
          <SquadStat icon={Users} label="Clientes" value={String(squad.clientCount)} />
        </div>
      </Link>
    </Card>
  );
}

export function SquadStat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-transparent bg-surface-2 p-2.5 transition-colors hover:border-border">
      <div className="flex items-center gap-1.5 text-[11px] text-muted">
        <Icon className="size-3.5" /> {label}
      </div>
      <div className="mt-0.5 text-sm font-semibold tabular-nums">{value}</div>
    </div>
  );
}
