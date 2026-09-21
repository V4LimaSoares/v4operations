import Link from "next/link";
import { cn } from "@/lib/utils";

/** Two sections of Materiais Operacionais — plain links (not client tabs) since each is its own route. */
export function MateriaisTabs({ active }: { active: "docs" | "files" }) {
  const base = "rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors";
  return (
    <div className="mb-6 inline-flex gap-1 rounded-lg bg-surface-2 p-1">
      <Link href="/materiais/docs" className={cn(base, active === "docs" ? "bg-surface shadow-sm" : "text-muted hover:text-foreground")}>
        Documentos
      </Link>
      <Link href="/materiais" className={cn(base, active === "files" ? "bg-surface shadow-sm" : "text-muted hover:text-foreground")}>
        Arquivos e links
      </Link>
    </div>
  );
}
