/**
 * Seeds the default permission profiles (Gestor, Operador, Visualizador) so the admin has
 * sensible starting points instead of an empty list. Safe to re-run — upserts by name.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PROFILES: { name: string; description: string; modules: string[]; isSystem: boolean }[] = [
  {
    name: "Gestor",
    description: "Acesso amplo ao dia a dia da operação — tudo, exceto gestão de usuários.",
    isSystem: true,
    modules: [
      "admin_overview",
      "dashboard",
      "clientes",
      "contas",
      "google_ads",
      "meta_ads",
      "campanhas",
      "anuncios",
      "insights",
      "faturamento",
      "relatorio",
      "sincronizacoes",
      "controle_sla",
      "health_score",
      "ajuda",
    ],
  },
  {
    name: "Operador",
    description: "Execução do dia a dia de campanhas — sem acesso a clientes, contas ou configurações.",
    isSystem: true,
    modules: ["dashboard", "google_ads", "meta_ads", "campanhas", "anuncios", "insights", "ajuda"],
  },
  {
    name: "Visualizador",
    description: "Somente visualização de resultados — dashboards, relatórios e insights.",
    isSystem: true,
    modules: ["dashboard", "relatorio", "insights", "ajuda"],
  },
];

async function main() {
  for (const p of PROFILES) {
    await prisma.permissionProfile.upsert({
      where: { name: p.name },
      update: { description: p.description, modules: p.modules, isSystem: p.isSystem },
      create: p,
    });
  }
  console.log(`Seeded ${PROFILES.length} permission profiles.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
