import "server-only";
import { prisma } from "@/lib/prisma";
import { PORTFOLIO_CATEGORY_ORDER } from "@/lib/portfolio-constants";

export async function listPortfolioItems() {
  return prisma.portfolioItem.findMany({
    orderBy: [{ category: "asc" }, { service: "asc" }, { variation: "asc" }],
  });
}

export type PortfolioItemRow = Awaited<ReturnType<typeof listPortfolioItems>>[number];

/** Grouped in the fixed SABER → TER → EXECUTAR → DESTRAVA_RECEITA → POTENCIALIZAR order (the
 *  order the catalog itself uses), not alphabetical — same convention as MATERIAL_CATEGORIES. */
export function groupPortfolioByCategory(items: PortfolioItemRow[]) {
  return PORTFOLIO_CATEGORY_ORDER.map((category) => ({
    category,
    items: items.filter((i) => i.category === category),
  })).filter((g) => g.items.length > 0);
}

export async function getPortfolioItemsByIds(ids: string[]) {
  if (ids.length === 0) return [];
  return prisma.portfolioItem.findMany({ where: { id: { in: ids } } });
}
