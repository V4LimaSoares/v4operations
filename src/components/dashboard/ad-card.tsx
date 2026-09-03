"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageOff, Search, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlatformBadge, DataSourceBadge } from "@/components/dashboard/badges";
import { AdDetailDialog } from "@/components/dashboard/ad-detail-dialog";
import { formatBRL, formatNumber, formatPercent } from "@/lib/utils";
import type { Platform, DataSource, EntityStatus } from "@prisma/client";

export type AdCardData = {
  id: string;
  name: string;
  headline: string | null;
  description: string | null;
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
  conversionValueBrl: number;
  cpa: number;
  roas: number;
};

export function AdCard({ ad, showClient }: { ad: AdCardData; showClient?: boolean }) {
  const [open, setOpen] = useState(false);
  const isGoogle = ad.platform === "GOOGLE_ADS";

  return (
    <>
      <Card className="overflow-hidden">
        {isGoogle ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex w-full items-center justify-between gap-3 border-b border-border bg-surface-2 px-4 py-6 text-left transition-colors hover:bg-border/60"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface text-google">
                <Search className="size-4.5" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted">Anúncio de pesquisa</p>
                <p className="text-xs text-muted-2">Ver detalhes do criativo</p>
              </div>
            </div>
            <ArrowUpRight className="size-4 shrink-0 text-muted-2" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="relative flex aspect-[4/3] w-full items-center justify-center bg-surface-2"
          >
            {ad.imageUrl ? (
              <Image src={ad.imageUrl} alt={ad.name} fill className="object-cover" unoptimized />
            ) : (
              <ImageOff className="size-8 text-muted-2" />
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-opacity hover:bg-black/40 hover:opacity-100">
              <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-black">Ver anúncio</span>
            </div>
          </button>
        )}

        <div className="p-4">
          <div className="mb-2 flex items-center gap-1.5">
            <PlatformBadge platform={ad.platform} />
            <DataSourceBadge dataSource={ad.dataSource} />
          </div>
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

          <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => setOpen(true)}>
            Ver detalhes
          </Button>
        </div>
      </Card>

      <AdDetailDialog ad={ad} open={open} onOpenChange={setOpen} />
    </>
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
