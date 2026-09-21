import type { ReactNode } from "react";
import { BackLink } from "@/components/layout/back-link";

export function PageHeader({
  title,
  description,
  actions,
  backHref,
  backLabel = "Voltar",
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  /** Shows a small "← Voltar" link above the title — for one-level-deep detail pages (list → detail). */
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        {backHref && (
          <BackLink fallbackHref={backHref} label={backLabel} />
        )}
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
