import Link from "next/link";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { ActivityFilters } from "@/components/admin/activity-filters";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils";
import type { BadgeProps } from "@/components/ui/badge";

const PAGE_SIZE = 50;

const ACTION_LABEL: Record<string, string> = {
  criou: "Criou",
  editou: "Editou",
  excluiu: "Excluiu",
  vinculou: "Vinculou",
  desvinculou: "Desvinculou",
};

const ACTION_VARIANT: Record<string, NonNullable<BadgeProps["variant"]>> = {
  criou: "positive",
  editou: "info",
  excluiu: "negative",
  vinculou: "primary",
  desvinculou: "warning",
};

export default async function AtividadesPage({
  searchParams,
}: {
  searchParams: Promise<{ entityType?: string; actor?: string; page?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const where = {
    ...(params.entityType && { entityType: params.entityType }),
    ...(params.actor && { actorName: params.actor }),
  };

  const [logs, total, entityTypes, actors] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.activityLog.count({ where }),
    prisma.activityLog.findMany({ distinct: ["entityType"], select: { entityType: true }, orderBy: { entityType: "asc" } }),
    prisma.activityLog.findMany({ distinct: ["actorName"], select: { actorName: true }, orderBy: { actorName: "asc" } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  function pageHref(p: number) {
    const sp = new URLSearchParams();
    if (params.entityType) sp.set("entityType", params.entityType);
    if (params.actor) sp.set("actor", params.actor);
    sp.set("page", String(p));
    return `/atividades?${sp.toString()}`;
  }

  return (
    <div>
      <PageHeader
        title="Atividades"
        description="Registro de quem criou, editou, excluiu ou vinculou o quê no sistema — data e horário de cada ação"
        actions={<ActivityFilters entityTypes={entityTypes.map((e) => e.entityType)} actors={actors.map((a) => a.actorName)} />}
      />

      <Card>
        {logs.length === 0 ? (
          <EmptyState message="Nenhuma atividade registrada ainda." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Entidade</TableHead>
                <TableHead>Detalhe</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-muted">{formatDateTime(log.createdAt)}</TableCell>
                  <TableCell className="font-medium">{log.actorName}</TableCell>
                  <TableCell>
                    <Badge variant={ACTION_VARIANT[log.action] ?? "default"}>{ACTION_LABEL[log.action] ?? log.action}</Badge>
                  </TableCell>
                  <TableCell>
                    {log.entityType} · {log.entityLabel}
                  </TableCell>
                  <TableCell className="text-muted">{log.detail ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-muted">
          <span>
            Página {page} de {totalPages} · {total} registro{total === 1 ? "" : "s"}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={pageHref(page - 1)} className="rounded-lg border border-border px-3 py-1.5 hover:bg-surface-2">
                Anterior
              </Link>
            )}
            {page < totalPages && (
              <Link href={pageHref(page + 1)} className="rounded-lg border border-border px-3 py-1.5 hover:bg-surface-2">
                Próxima
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
