import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { requireStaffModule } from "@/lib/session";
import { getDocById, getDocBreadcrumb } from "@/lib/data/material-docs";
import { MateriaisTabs } from "@/components/materiais/materiais-tabs";
import { DocView, type DocViewData } from "@/components/materiais/doc-view";

export default async function DocPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireStaffModule("materiais");
  const { id } = await params;
  const [doc, trail] = await Promise.all([getDocById(id), getDocBreadcrumb(id)]);
  if (!doc) notFound();

  const data: DocViewData = {
    id: doc.id,
    parentId: doc.parentId,
    title: doc.title,
    icon: doc.icon,
    contentMd: doc.contentMd,
    props: (doc.props as Record<string, string> | null) ?? null,
    sourceUrl: doc.sourceUrl,
    updatedAt: doc.updatedAt.toISOString(),
    updatedByName: doc.updatedByName,
    children: doc.children,
  };

  return (
    <div>
      <MateriaisTabs active="docs" />
      <nav className="mb-5 flex flex-wrap items-center gap-1 text-xs text-muted">
        <Link href="/materiais/docs" className="hover:text-foreground">Documentos</Link>
        {trail.slice(0, -1).map((t) => (
          <span key={t.id} className="flex items-center gap-1">
            <ChevronRight className="size-3" />
            <Link href={`/materiais/docs/${t.id}`} className="hover:text-foreground">{t.title}</Link>
          </span>
        ))}
      </nav>
      <DocView key={doc.id + doc.updatedAt.toISOString()} doc={data} isAdmin={user.role === "ADMIN"} />
    </div>
  );
}
