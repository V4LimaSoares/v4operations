import Image from "next/image";
import { ImageOff } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PlatformBadge, DataSourceBadge } from "@/components/dashboard/badges";
import { formatBRL, formatNumber, formatPercent } from "@/lib/utils";
import type { Platform, DataSource, EntityStatus } from "@prisma/client";

export type AdCardData = {
  id: string;
  name: string;
  imageUrl: string | null;
  status: EntityStatus;
  dataSource: DataSource;
  platform: Platform;
  clientName: string;
  campaignName: string;
  adGroupName: string;
  costBrl: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  conversions: number;
  cpa: number;
  roas: number;
};

export function AdCard({ ad, showClient }: { ad: AdCardData; showClient?: boolean }) {
  return (
    <Card className="overflow-hidden">
      <div className="relative flex aspect-[4/3] items-center justify-center bg-surface-2">
        {ad.imageUrl ? (
          <Image src={ad.imageUrl} alt={ad.name} fill className="object-cover" unoptimized />
        ) : (
          <ImageOff className="size-8 text-muted-2" />
        )}
        <div className="absolute left-2 top-2">
          <PlatformBadge platform={ad.platform} />
        </div>
        <div className="absolute right-2 top-2">
          <DataSourceBadge dataSource={ad.dataSource} />
        </div>
      </div>
      <div className="p-4">
        <p className="truncate text-sm font-semibold">{ad.name}</p>
        <p className="truncate text-xs text-muted">
          {showClient ? `${ad.clientName} · ` : ""}
          {ad.campaignName} / {ad.adGroupName}
        </p>

        <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
          <Metric label="Investimento" value={formatBRL(ad.costBrl)} />
          <Metric label="ROAS" value={`${ad.roas.toFixed(2)}x`} />
          <Metric label="Impressões" value={formatNumber(ad.impressions)} />
          <Metric label="Cliques" value={formatNumber(ad.clicks)} />
          <Metric label="CTR" value={formatPercent(ad.ctr)} />
          <Metric label="CPC" value={formatBRL(ad.cpc)} />
          <Metric label="Conversões" value={formatNumber(ad.conversions, 1)} />
          <Metric label="CPA" value={ad.cpa ? formatBRL(ad.cpa) : "—"} />
        </div>
      </div>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-2">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}
