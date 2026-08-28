import { requireUser } from "@/lib/session";
import { resolveScope } from "@/lib/scope";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { GenerateInsightsButton } from "@/components/dashboard/generate-insights-button";
import { DataSourceBadge, PlatformBadge } from "@/components/dashboard/badges";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import type { InsightCategory } from "@prisma/client";

const CATEGORY_META: Record<InsightCategory, { label: string; emoji: string; className: string }> = {
  OPPORTUNITY: { label: "Oportunidades", emoji: "🟢", className: "border-positive" },
  PROBLEM: { label: "Problemas", emoji: "🔴", className: "border-negative" },
  ATTENTION: { label: "Atenção", emoji: "🟡", className: "border-warning" },
  HIGHLIGHT: { label: "Destaques", emoji: "🔵", className: "border-info" },
};

const ORDER: InsightCategory[] = ["PROBLEM", "OPPORTUNITY", "ATTENTION", "HIGHLIGHT"];

export default async function InsightsPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const scope = resolveScope(user, params.clientId);

  const insights = await prisma.insight.findMany({
    where: { clientId: scope.clientId ?? undefined, dismissed: false },
    include: { client: { select: { name: true } } },
    orderBy: { generatedAt: "desc" },
  });

  const grouped = ORDER.map((category) => ({
    category,
    items: insights.filter((i) => i.category === category),
  }));

  const lastGeneratedAt = insights[0]?.generatedAt;

  return (
    <div>
      <PageHeader
        title="Insights"
        description={
          lastGeneratedAt
            ? `Última geração: ${formatDate(lastGeneratedAt)}`
            : "Interpretações automáticas de performance geradas a partir dos dados de campanha"
        }
        actions={<GenerateInsightsButton />}
      />

      {insights.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted">
          Nenhum insight gerado ainda. Clique em &ldquo;Gerar insights agora&rdquo; para analisar o período mais recente.
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {grouped.map(({ category, items }) => {
            const meta = CATEGORY_META[category];
            if (items.length === 0) return null;
            return (
              <div key={category}>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <span>{meta.emoji}</span> {meta.label}
                  <span className="text-xs font-normal text-muted-2">({items.length})</span>
                </h2>
                <div className="flex flex-col gap-3">
                  {items.map((insight) => (
                    <Card key={insight.id} className={`border-l-4 p-4 ${meta.className}`}>
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold">{insight.title}</p>
                        <DataSourceBadge dataSource={insight.dataSource} />
                      </div>
                      <p className="mt-1.5 text-sm text-muted">{insight.description}</p>
                      <div className="mt-2 flex items-center gap-2">
                        {insight.platform && <PlatformBadge platform={insight.platform} />}
                        {scope.isAggregate && (
                          <span className="text-xs text-muted-2">{insight.client.name}</span>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
