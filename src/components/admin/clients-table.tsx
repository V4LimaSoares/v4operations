"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ClientStatusBadge } from "@/components/dashboard/badges";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { ClientRowActions } from "@/components/admin/client-row-actions";
import { formatBRL, formatNumber } from "@/lib/utils";
import type { listClientsWithStats } from "@/lib/data/clients";

type ClientRow = Awaited<ReturnType<typeof listClientsWithStats>>[number];

function normalize(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function ClientsTable({ clients }: { clients: ClientRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return clients;
    return clients.filter((c) => normalize(c.name).includes(q) || normalize(c.company).includes(q));
  }, [clients, query]);

  return (
    <>
      <div className="mb-3 flex items-center gap-2">
        <div className="relative max-w-72 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-2" />
          <Input
            placeholder="Buscar por nome ou empresa…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
            aria-label="Buscar clientes"
          />
        </div>
        {query && (
          <span className="text-xs text-muted">
            {filtered.length} de {clients.length}
          </span>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Equipe</TableHead>
                <TableHead>Conta Google</TableHead>
                <TableHead>Conta Meta</TableHead>
                <TableHead className="text-right">Investimento (30d)</TableHead>
                <TableHead className="text-right">Conversões</TableHead>
                <TableHead className="text-right">Faturamento</TableHead>
                <TableHead className="text-right">ROAS</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10}>
                    <EmptyState message={clients.length === 0 ? "Nenhum cliente cadastrado ainda." : "Nenhum cliente encontrado para essa busca."} />
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link href={`/clientes/${c.id}`} className="font-medium text-foreground hover:text-primary hover:underline">
                      {c.name}
                    </Link>
                    <p className="text-xs text-muted">{c.company}</p>
                  </TableCell>
                  <TableCell>
                    {c.team.length === 0 ? (
                      <span className="text-xs text-muted-2">—</span>
                    ) : (
                      <div className="flex -space-x-1.5">
                        {c.team.slice(0, 4).map((m) => (
                          <div
                            key={m.id}
                            title={m.name}
                            className="flex size-6 items-center justify-center rounded-full border-2 border-surface text-[10px] font-bold text-white"
                            style={{ background: m.colorVar }}
                          >
                            {m.name[0]}
                          </div>
                        ))}
                        {c.team.length > 4 && (
                          <div
                            title={c.team.slice(4).map((m) => m.name).join(", ")}
                            className="flex size-6 items-center justify-center rounded-full border-2 border-surface bg-surface-2 text-[10px] font-bold text-muted"
                          >
                            +{c.team.length - 4}
                          </div>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted">
                    {c.googleAccounts.length > 0 ? c.googleAccounts.map((a) => a.name).join(", ") : "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted">
                    {c.metaAccounts.length > 0 ? c.metaAccounts.map((a) => a.name).join(", ") : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatBRL(c.costBrl)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatNumber(c.conversions, 1)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatBRL(c.revenueBrl)}</TableCell>
                  <TableCell className="text-right tabular-nums">{c.roas.toFixed(2)}x</TableCell>
                  <TableCell>
                    <ClientStatusBadge status={c.status} />
                  </TableCell>
                  <TableCell>
                    <ClientRowActions
                      id={c.id}
                      status={c.status}
                      client={{ id: c.id, name: c.name, company: c.company, notes: c.notes, slaGroupName: c.slaGroupName, ekyteClientName: c.ekyteClientName }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
