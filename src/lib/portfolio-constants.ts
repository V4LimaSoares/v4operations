import type { PortfolioCategory } from "@prisma/client";

// Not server-only — imported by client components too (dialogs, badges), same reasoning as
// MATERIAL_CATEGORIES living outside the server-only data module.
export const PORTFOLIO_CATEGORY_ORDER: PortfolioCategory[] = ["SABER", "TER", "EXECUTAR", "DESTRAVA_RECEITA", "POTENCIALIZAR"];

export const PORTFOLIO_CATEGORY_LABEL: Record<PortfolioCategory, string> = {
  SABER: "Saber",
  TER: "Ter",
  EXECUTAR: "Executar",
  DESTRAVA_RECEITA: "Destrava Receita",
  POTENCIALIZAR: "Potencializar",
};
