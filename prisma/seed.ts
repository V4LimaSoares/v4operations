/**
 * Seeds demo tenants only. Never touches clients that own a REAL ad account —
 * safe to re-run after `prisma/import-real-data.ts` has populated real clients.
 */
import { PrismaClient, Prisma, type Platform } from "@prisma/client";
import { hashPassword } from "../src/lib/auth";
import { randomDailyMetric, splitAcrossChildren } from "../src/lib/demo/generator";
import { generateSearchTermVariants, randomSearchTermStatus, randomSearchTermMetric } from "../src/lib/demo/search-terms";
import { FUNNEL_STAGE_NAMES, generateFunnelCounts } from "../src/lib/demo/funnel";

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@portaltrafego.com.br";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "Admin@12345";
const DEMO_PASSWORD = "Demo@12345";
const DAYS_OF_HISTORY = 60;

const KEYWORD_MATCH_TYPES = ["EXACT", "PHRASE", "BROAD"] as const;

type DemoClientSpec = {
  name: string;
  company: string;
  email: string;
  segment: string;
  platforms: Platform[];
};

const DEMO_CLIENTS: DemoClientSpec[] = [
  { name: "Marina Souza", company: "Loja Aurora Modas", email: "contato@auroramodas.com.br", segment: "moda", platforms: ["GOOGLE_ADS", "META_ADS"] },
  { name: "Dr. Rafael Lima", company: "Clínica Vitalis", email: "contato@clinicavitalis.com.br", segment: "saúde", platforms: ["GOOGLE_ADS", "META_ADS"] },
  { name: "Eduardo Ramos", company: "Construtora Horizonte", email: "contato@construtorahorizonte.com.br", segment: "construção", platforms: ["GOOGLE_ADS"] },
  { name: "Camila Duarte", company: "Studio Fit Performance", email: "contato@studiofitperformance.com.br", segment: "fitness", platforms: ["META_ADS"] },
];

const CAMPAIGN_THEMES: Record<string, string[]> = {
  moda: ["Coleção Verão — Vendas", "Remarketing Carrinho Abandonado", "Institucional — Marca"],
  saúde: ["Agendamento de Consultas", "Campanha Institucional", "Remarketing Pacientes"],
  construção: ["Lançamento Residencial", "Geração de Leads — Terrenos", "Institucional — Construtora"],
  fitness: ["Matrículas — Plano Anual", "Aulas Experimentais Grátis", "Remarketing Leads Frios"],
};

const AD_GROUP_THEMES = ["Público Frio", "Remarketing", "Público Quente"];
const KEYWORD_POOL: Record<string, string[]> = {
  moda: ["roupas femininas online", "vestido de festa", "loja de roupas", "moda feminina", "comprar blusa"],
  saúde: ["clínica perto de mim", "agendar consulta médica", "exame de rotina", "especialista particular"],
  construção: ["apartamento novo", "terreno à venda", "construtora perto de mim", "imóvel na planta"],
};

function externalId(prefix: string) {
  return `${prefix}${Math.floor(1000000000 + Math.random() * 8999999999)}`;
}

function placeholderImage(seed: string) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/600/450`;
}

function datesBack(n: number) {
  const dates: Date[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    dates.push(d);
  }
  return dates;
}

async function main() {
  console.log("Seeding admin user...");
  const adminPasswordHash = await hashPassword(ADMIN_PASSWORD);
  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: { email: ADMIN_EMAIL, name: "Administrador", passwordHash: adminPasswordHash, role: "ADMIN" },
  });

  const demoPasswordHash = await hashPassword(DEMO_PASSWORD);
  const dates = datesBack(DAYS_OF_HISTORY);

  for (const spec of DEMO_CLIENTS) {
    const existing = await prisma.client.findFirst({ where: { company: spec.company } });
    if (existing) {
      console.log(`Skipping "${spec.company}" — already seeded.`);
      continue;
    }

    console.log(`Seeding client "${spec.company}"...`);
    const client = await prisma.client.create({
      data: {
        name: spec.name,
        company: spec.company,
        status: "ACTIVE",
        users: {
          create: { name: spec.name, email: spec.email, passwordHash: demoPasswordHash, role: "CLIENT" },
        },
      },
    });

    for (const platform of spec.platforms) {
      const account = await prisma.adAccount.create({
        data: {
          clientId: client.id,
          platform,
          externalId: externalId(platform === "GOOGLE_ADS" ? "10" : "act_5"),
          name: `${spec.company} — ${platform === "GOOGLE_ADS" ? "Google Ads" : "Meta Ads"}`,
          currency: "BRL",
          dataSource: "DEMO",
          lastSyncAt: new Date(),
        },
      });

      const themes = CAMPAIGN_THEMES[spec.segment] ?? ["Campanha Principal", "Remarketing", "Institucional"];

      for (const themeName of themes) {
        const campaign = await prisma.campaign.create({
          data: {
            adAccountId: account.id,
            externalId: externalId("c"),
            name: themeName,
            status: "ENABLED",
            objective: platform === "GOOGLE_ADS" ? "SALES" : "CONVERSIONS",
            budgetDailyBrl: Math.round(rand(60, 350)),
            dataSource: "DEMO",
          },
        });

        for (const groupTheme of AD_GROUP_THEMES.slice(0, 2)) {
          const adGroup = await prisma.adGroup.create({
            data: {
              campaignId: campaign.id,
              externalId: externalId("g"),
              name: `${groupTheme} — ${themeName}`,
              status: "ENABLED",
              dataSource: "DEMO",
            },
          });

          const ads = await Promise.all(
            [1, 2].map((n) =>
              prisma.ad.create({
                data: {
                  campaignId: campaign.id,
                  adGroupId: adGroup.id,
                  externalId: externalId("ad"),
                  name: `${spec.company} — Anúncio ${n}`,
                  status: "ENABLED",
                  headline: `${spec.company} | ${groupTheme}`,
                  description: `Confira as ofertas de ${spec.company.toLowerCase()}.`,
                  imageUrl: platform === "META_ADS" ? placeholderImage(`${client.id}-${adGroup.id}-${n}`) : null,
                  creativeType: platform === "GOOGLE_ADS" ? "RESPONSIVE_SEARCH_AD" : "IMAGE",
                  dataSource: "DEMO",
                },
              })
            )
          );

          const keywords =
            platform === "GOOGLE_ADS"
              ? await Promise.all(
                  (KEYWORD_POOL[spec.segment] ?? ["produto", "serviço", "empresa"]).slice(0, 3).map((text) =>
                    prisma.keyword.create({
                      data: {
                        campaignId: campaign.id,
                        adGroupId: adGroup.id,
                        externalId: externalId("kw"),
                        text,
                        matchType: KEYWORD_MATCH_TYPES[Math.floor(Math.random() * KEYWORD_MATCH_TYPES.length)],
                        status: "ENABLED",
                        qualityScore: Math.ceil(rand(4, 10)),
                        dataSource: "DEMO",
                      },
                    })
                  )
                )
              : [];

          // Daily metrics: split the ad-group's day into ad-level rows (source of truth
          // for rollups) and, for Google, a separate keyword-level partition of the same
          // spend (its own dimensional slice — see the note in lib/data/metrics.ts).
          const adMetricRows: Prisma.MetricCreateManyInput[] = [];
          const keywordMetricRows: Prisma.MetricCreateManyInput[] = [];

          for (const date of dates) {
            const groupMetric = randomDailyMetric({ platform, scale: rand(0.5, 1.3), qualityBias: rand(0.3, 0.8) });

            for (const { child: ad, metric } of splitAcrossChildren(ads, groupMetric)) {
              adMetricRows.push({
                date,
                adAccountId: account.id,
                campaignId: campaign.id,
                adGroupId: adGroup.id,
                adId: ad.id,
                platform,
                dataSource: "DEMO",
                impressions: metric.impressions,
                clicks: metric.clicks,
                costBrl: metric.costBrl,
                conversions: metric.conversions,
                conversionValueBrl: metric.conversionValueBrl,
                reach: metric.reach,
                leads: metric.leads,
              });
            }

            for (const { child: keyword, metric } of splitAcrossChildren(keywords, groupMetric)) {
              keywordMetricRows.push({
                date,
                adAccountId: account.id,
                campaignId: campaign.id,
                adGroupId: adGroup.id,
                keywordId: keyword.id,
                platform,
                dataSource: "DEMO",
                impressions: metric.impressions,
                clicks: metric.clicks,
                costBrl: metric.costBrl,
                conversions: metric.conversions,
                conversionValueBrl: metric.conversionValueBrl,
              });
            }
          }

          if (adMetricRows.length) await prisma.metric.createMany({ data: adMetricRows });
          if (keywordMetricRows.length) await prisma.metric.createMany({ data: keywordMetricRows });

          if (platform === "GOOGLE_ADS" && keywords.length) {
            const periodEnd = dates[dates.length - 1];
            const periodStart = dates[0];
            const searchTermRows: Prisma.SearchTermCreateManyInput[] = [];
            for (const keyword of keywords) {
              for (const text of generateSearchTermVariants(keyword.text, 2 + Math.floor(Math.random() * 2))) {
                searchTermRows.push({
                  adAccountId: account.id,
                  campaignId: campaign.id,
                  adGroupId: adGroup.id,
                  text,
                  status: randomSearchTermStatus(),
                  periodStart,
                  periodEnd,
                  dataSource: "DEMO",
                  ...randomSearchTermMetric(20 + Math.random() * 40),
                });
              }
            }
            if (searchTermRows.length) await prisma.searchTerm.createMany({ data: searchTermRows });
          }
        }
      }

      if (platform === "GOOGLE_ADS") {
        const stageNames = FUNNEL_STAGE_NAMES[spec.segment];
        if (stageNames) {
          const accountClicks = await prisma.metric.aggregate({
            where: { adAccountId: account.id, keywordId: null },
            _sum: { clicks: true },
          });
          const counts = generateFunnelCounts(accountClicks._sum.clicks ?? 0, stageNames.length);
          await prisma.funnelStage.createMany({
            data: stageNames.map((name, i) => ({
              adAccountId: account.id,
              name,
              order: i,
              conversions: counts[i],
              periodStart: dates[0],
              periodEnd: dates[dates.length - 1],
              dataSource: "DEMO",
            })),
          });
        }
      }
    }

    // A few manual revenue entries so the Faturamento page has something real to show.
    await prisma.revenueEntry.createMany({
      data: dates
        .filter((_, i) => i % 7 === 0)
        .map((date) => ({
          clientId: client.id,
          date,
          amountBrl: Math.round(rand(1500, 9000)),
          source: "MANUAL",
          notes: "Faturamento semanal informado pelo cliente",
        })),
    });
  }

  console.log(
    "\nSkipping insight generation here (lib/insights-engine.ts imports the 'server-only' guard, " +
      "which only resolves inside Next's server compilation — not a plain Node script). " +
      "Insights are generated from the running app: log in as admin and click " +
      '"Gerar insights agora" on the Insights page, or POST /api/insights/generate.'
  );

  console.log("\nSeed completed.");
  console.log(`Admin login: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log(`Demo client login (any demo client email above) / ${DEMO_PASSWORD}`);
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
