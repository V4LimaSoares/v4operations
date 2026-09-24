import { requireStaffModule } from "@/lib/session";
import { listPortfolioItems, groupPortfolioByCategory } from "@/lib/data/portfolio";
import { PORTFOLIO_CATEGORY_LABEL } from "@/lib/portfolio-constants";
import { PageHeader } from "@/components/layout/page-header";
import { PortfolioItemDialog } from "@/components/admin/portfolio-item-dialog";
import { PortfolioSeedButton } from "@/components/admin/portfolio-seed-button";
import { PortfolioCategoryTable } from "@/components/admin/portfolio-table";

export default async function PortfolioPage() {
  const user = await requireStaffModule("portfolio");
  const items = await listPortfolioItems();
  const groups = groupPortfolioByCategory(items);
  const isAdmin = user.role === "ADMIN";

  return (
    <div>
      <PageHeader
        title="Portfólio"
        description="Catálogo de serviços V4 — categoria, serviço, variação, valor base e descrição. Usado no cadastro de clientes para registrar o que cada um contratou."
        actions={
          isAdmin ? (
            <div className="flex flex-wrap items-center gap-2">
              <PortfolioSeedButton />
              <PortfolioItemDialog />
            </div>
          ) : undefined
        }
      />

      <div className="flex flex-col gap-8">
        {groups.map((g) => (
          <div key={g.category}>
            <h2 className="mb-3 text-sm font-semibold">
              {PORTFOLIO_CATEGORY_LABEL[g.category]} <span className="font-normal text-muted-2">({g.items.length})</span>
            </h2>
            <PortfolioCategoryTable items={g.items} isAdmin={isAdmin} />
          </div>
        ))}
      </div>
    </div>
  );
}
