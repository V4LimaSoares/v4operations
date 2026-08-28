import { Badge } from "@/components/ui/badge";
import type { Platform, EntityStatus, DataSource } from "@prisma/client";

export function PlatformBadge({ platform }: { platform: Platform }) {
  return (
    <Badge variant="outline" className="gap-1.5">
      <span
        className="size-1.5 rounded-full"
        style={{ background: platform === "GOOGLE_ADS" ? "var(--color-google)" : "var(--color-meta)" }}
      />
      {platform === "GOOGLE_ADS" ? "Google Ads" : "Meta Ads"}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: EntityStatus }) {
  const map: Record<EntityStatus, { label: string; variant: "positive" | "warning" | "default" }> = {
    ENABLED: { label: "Ativo", variant: "positive" },
    PAUSED: { label: "Pausado", variant: "warning" },
    REMOVED: { label: "Removido", variant: "default" },
  };
  const cfg = map[status];
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

export function DataSourceBadge({ dataSource }: { dataSource: DataSource }) {
  return dataSource === "REAL" ? (
    <Badge variant="info">Dado real</Badge>
  ) : (
    <Badge variant="outline">Demo</Badge>
  );
}
