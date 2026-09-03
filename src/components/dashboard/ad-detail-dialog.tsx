"use client";

import Image from "next/image";
import { ImageOff, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { PlatformBadge, DataSourceBadge, StatusBadge } from "@/components/dashboard/badges";
import { formatBRL, formatNumber, formatPercent } from "@/lib/utils";
import type { AdCardData } from "@/components/dashboard/ad-card";

export function AdDetailDialog({
  ad,
  open,
  onOpenChange,
}: {
  ad: AdCardData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <PlatformBadge platform={ad.platform} />
            <StatusBadge status={ad.status} />
            <DataSourceBadge dataSource={ad.dataSource} />
          </div>
          <DialogTitle>{ad.name}</DialogTitle>
          <DialogDescription>
            {ad.campaignName} / {ad.adGroupName}
          </DialogDescription>
        </DialogHeader>

        {ad.platform === "META_ADS" && (
          <div className="relative mb-4 flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg bg-surface-2">
            {ad.imageUrl ? (
              <Image src={ad.imageUrl} alt={ad.name} fill className="object-cover" unoptimized />
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-2">
                <ImageOff className="size-8" />
                <span className="text-xs">Criativo não disponível para esta conta</span>
              </div>
            )}
          </div>
        )}

        {(ad.headline || ad.description) && (
          <div className="mb-4 rounded-lg border border-border p-3">
            {ad.headline && <p className="text-sm font-semibold">{ad.headline}</p>}
            {ad.description && <p className="mt-1 text-sm text-muted">{ad.description}</p>}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Metric label="Investimento" value={formatBRL(ad.costBrl)} />
          <Metric label="Impressões" value={formatNumber(ad.impressions)} />
          <Metric label="Cliques" value={formatNumber(ad.clicks)} />
          <Metric label="CTR" value={formatPercent(ad.ctr)} />
          <Metric label="CPC" value={formatBRL(ad.cpc)} />
          <Metric label="CPA" value={ad.cpa ? formatBRL(ad.cpa) : "—"} />
          <Metric label="Conversões" value={formatNumber(ad.conversions, 1)} />
          <Metric label="Valor de conversão" value={formatBRL(ad.conversionValueBrl)} />
          <Metric label="ROAS" value={`${ad.roas.toFixed(2)}x`} />
        </div>

        {ad.platform === "GOOGLE_ADS" && (
          <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-2">
            <ExternalLink className="size-3.5" />
            Anúncios de pesquisa do Google não têm imagem — o texto acima é o criativo (título e descrição).
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface-2 p-2.5">
      <p className="text-[10px] font-medium uppercase text-muted">{label}</p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}
