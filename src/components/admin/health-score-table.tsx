"use client";

import { useState } from "react";
import type { HealthScoreEntry } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { HealthScoreDialog, toHealthScoreFormEntry } from "@/components/admin/health-score-dialog";
import { cn } from "@/lib/utils";

function flagDotClass(flag: string | null) {
  const f = (flag ?? "").trim().toLowerCase();
  if (f.startsWith("risco iminente")) return "bg-negative";
  if (f.startsWith("risco")) return "bg-warning";
  if (f.startsWith("saud")) return "bg-positive";
  return "bg-muted-2";
}

/** Deliberately shows only the client name — one glance at the flag color, nothing else — so the
 *  global carteira table stays light. Every other field lives in the full record, opened by
 *  clicking the row. */
export function HealthScoreTable({
  entries,
  clients,
}: {
  entries: HealthScoreEntry[];
  clients: { id: string; name: string; company: string }[];
}) {
  const [selected, setSelected] = useState<HealthScoreEntry | null>(null);

  if (entries.length === 0) {
    return (
      <Card className="mt-6">
        <CardContent className="p-0">
          <EmptyState message="Nenhum registro de Health Score cadastrado ainda." />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="mt-6">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((e) => (
                <TableRow key={e.id} className="cursor-pointer" onClick={() => setSelected(e)}>
                  <TableCell>
                    <span className="inline-flex items-center gap-2 font-medium text-foreground">
                      <span className={cn("size-2 shrink-0 rounded-full", flagDotClass(e.flag))} />
                      {e.clientName}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selected && (
        <HealthScoreDialog
          clients={clients}
          entry={toHealthScoreFormEntry(selected)}
          trigger={null}
          open={!!selected}
          onOpenChange={(o) => {
            if (!o) setSelected(null);
          }}
        />
      )}
    </>
  );
}
