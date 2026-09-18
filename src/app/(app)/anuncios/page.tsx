import { requireModule } from "@/lib/session";
import { resolveScope } from "@/lib/scope";
import { presetToRange } from "@/lib/data/metrics";
import { getAdGallery, type AdSortKey } from "@/lib/data/ads";
import { PageHeader } from "@/components/layout/page-header";
import { AdsToolbar } from "@/components/layout/ads-toolbar";
import { AdCard } from "@/components/dashboard/ad-card";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { Platform } from "@prisma/client";

export default async function AnunciosPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; platform?: string; clientId?: string; sort?: string }>;
}) {
  const user = await requireModule("anuncios");
  const params = await searchParams;
  const scope = resolveScope(user, params.clientId);
  const range = presetToRange(params.period ?? "30d");
  const platform = (params.platform as Platform | "all") ?? "all";
  const sort = (params.sort as AdSortKey) ?? "cost";

  const ads = await getAdGallery(scope, range, { platform, sort });

  return (
    <div>
      <PageHeader title="Anúncios" description="Galeria de anúncios reais das campanhas ativas" actions={<AdsToolbar />} />

      {ads.length === 0 ? (
        <Card>
          <EmptyState message="Nenhum anúncio encontrado para os filtros selecionados." />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {ads.map((ad) => (
            <AdCard key={ad.id} ad={ad} showClient={scope.isAggregate} />
          ))}
        </div>
      )}
    </div>
  );
}
