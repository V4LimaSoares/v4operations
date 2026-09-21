import Link from "next/link";
import { FileText, Search } from "lucide-react";
import { requireStaffModule } from "@/lib/session";
import { listRootDocs, searchDocs } from "@/lib/data/material-docs";
import { PageHeader } from "@/components/layout/page-header";
import { MateriaisTabs } from "@/components/materiais/materiais-tabs";
import { NotionImportButton } from "@/components/materiais/notion-import-button";
import { NewDocButton } from "@/components/materiais/new-doc-button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export default async function DocsIndexPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await requireStaffModule("materiais");
  const { q } = await searchParams;
  const query = q?.trim();
  const [roots, results] = await Promise.all([listRootDocs(), query ? searchDocs(query) : Promise.resolve(null)]);

  return (
    <div>
      <PageHeader
        title="Materiais Operacionais"
        description="Apresentações, playbooks e documentos de referência para o time"
        actions={user.role === "ADMIN" ? <div className="flex items-center gap-3"><NotionImportButton /><NewDocButton /></div> : undefined}
      />
      <MateriaisTabs active="docs" />

      <form className="relative mb-6 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-2" />
        <input
          name="q"
          defaultValue={query}
          placeholder="Buscar nos documentos…"
          className="h-10 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm outline-none focus:border-primary"
        />
      </form>

      {results ? (
        results.length === 0 ? (
          <Card><EmptyState message="Nenhum documento encontrado." /></Card>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((d) => (
              <Link key={d.id} href={`/materiais/docs/${d.id}`}>
                <Card className="flex items-center gap-3 p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg">
                  <span className="text-lg">{d.icon ?? <FileText className="size-4" />}</span>
                  <span className="truncate text-sm font-medium">{d.title}</span>
                </Card>
              </Link>
            ))}
          </div>
        )
      ) : roots.length === 0 ? (
        <Card><EmptyState message="Nenhum documento ainda." /></Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {roots.map((d) => (
            <Link key={d.id} href={`/materiais/docs/${d.id}`}>
              <Card className="flex h-full flex-col gap-3 p-5 transition-all hover:-translate-y-0.5 hover:border-muted-2 hover:shadow-lg">
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary-soft text-xl text-primary">
                  {d.icon ?? <FileText className="size-5" />}
                </span>
                <div className="text-sm font-semibold leading-snug">{d.title}</div>
                {d._count.children > 0 && <div className="text-xs text-muted-2">{d._count.children} sub-página{d._count.children === 1 ? "" : "s"}</div>}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
