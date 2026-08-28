/**
 * One-off import of REAL pilot-client data, fetched live from the Meta Ads MCP
 * (mcp__v4-ads__meta_get_campaign_performance / meta_get_ad_performance) during
 * a Claude Code session on 2026-08-28, for accounts already connected to the
 * agency's MCC/Business Manager. This is the "MCP-assisted sync" pattern described
 * in the README: until official server-side Google Ads / Meta API credentials are
 * configured, real data is pulled by asking Claude (with the MCPs connected) to
 * re-run an import like this one — the app itself never calls the MCP directly.
 *
 * Google Ads data for these two accounts could NOT be imported this run: the
 * MCP returned "Falha de autenticação com o Google Ads — a conexão OAuth do
 * gestor pode ter sido revogada". The Google Ads AdAccount rows below are
 * still created (the accounts are real and connected in the MCC) but carry no
 * campaigns/metrics yet — reconnect the OAuth and re-run a Google import to
 * fill them in.
 */
import { PrismaClient, type Platform } from "@prisma/client";
import { hashPassword } from "../src/lib/auth";

const prisma = new PrismaClient();

const REAL_CLIENT_PASSWORD = "RealClient@2026";

type RealAd = {
  externalId: string;
  name: string;
  adSetExternalId: string;
  adSetName: string;
  spendBrl: number;
  impressions: number;
  clicks: number;
  reach: number;
  purchasesValueBrl: number;
};

type RealCampaign = {
  externalId: string;
  name: string;
  objective: string;
  ads: RealAd[];
  /** Aggregate totals for the previous 30-day period (2026-06-30..2026-07-29), split
   *  proportionally across `ads` by current-period spend since the MCP call only
   *  returned this at campaign level, not per-ad, for the prior period. */
  previousPeriod?: { spendBrl: number; impressions: number; clicks: number };
};

type RealClientSpec = {
  name: string;
  company: string;
  email: string;
  googleCustomerId: string;
  metaAdAccountId: string;
  metaAccountName: string;
  campaigns: RealCampaign[];
};

const REAL_CLIENTS: RealClientSpec[] = [
  {
    name: "Contato Imperial Alimentos",
    company: "Imperial Alimentos",
    email: "contato@imperialalimentos.com.br",
    googleCustomerId: "8726746966",
    metaAdAccountId: "act_1648706246292124",
    metaAccountName: "Imperial Alimentos",
    campaigns: [
      {
        externalId: "120239249654400656",
        name: "[CP] [V4] [ENGAJAMENTO] [WHATSAPP] [B2B]",
        objective: "OUTCOME_ENGAGEMENT",
        ads: [
          {
            externalId: "120240324440730656",
            name: "AD - Qualidade que aparece",
            adSetExternalId: "120240324440720656",
            adSetName: "[CJ] [RESTAURANTES] [PARÁ]",
            spendBrl: 0.09,
            impressions: 12,
            clicks: 0,
            reach: 12,
            purchasesValueBrl: 0,
          },
        ],
      },
    ],
  },
  {
    name: "Contato Destak Materiais",
    company: "Destak Materiais",
    email: "contato@destakmateriais.com.br",
    googleCustomerId: "3542818676",
    metaAdAccountId: "act_760944201482985",
    metaAccountName: "CA - Destak Materiais",
    campaigns: [
      {
        externalId: "120246723865440701",
        name: "[CP] [V4] [ENGAJAMENTO] [WHATSAPP] [01]",
        objective: "OUTCOME_ENGAGEMENT",
        previousPeriod: { spendBrl: 58.61, impressions: 9341, clicks: 186 },
        ads: [
          {
            externalId: "120246723865430701",
            name: "AD - A Destak chegou para ser referência",
            adSetExternalId: "120246723865450701",
            adSetName: "[CJ] [PUB-ABERTO] [WHATSAPP]",
            spendBrl: 506.52,
            impressions: 95966,
            clicks: 937,
            reach: 16427,
            purchasesValueBrl: 0,
          },
          {
            externalId: "120247948562050701",
            name: "AD - Precisando de cimento para sua obra?",
            adSetExternalId: "120246723865450701",
            adSetName: "[CJ] [PUB-ABERTO] [WHATSAPP]",
            spendBrl: 58.08,
            impressions: 8838,
            clicks: 73,
            reach: 3965,
            purchasesValueBrl: 0,
          },
          {
            externalId: "120247948832430701",
            name: "AD - Orçamento e Materiais em Geral",
            adSetExternalId: "120246723865450701",
            adSetName: "[CJ] [PUB-ABERTO] [WHATSAPP]",
            spendBrl: 5.82,
            impressions: 874,
            clicks: 2,
            reach: 628,
            purchasesValueBrl: 0,
          },
          {
            externalId: "120246724620010701",
            name: "AD - Construção, Reforma e Reparo",
            adSetExternalId: "120246723865450701",
            adSetName: "[CJ] [PUB-ABERTO] [WHATSAPP]",
            spendBrl: 2.06,
            impressions: 374,
            clicks: 5,
            reach: 260,
            purchasesValueBrl: 0,
          },
          {
            externalId: "120247948751270701",
            name: "AD - Vai pintar ou renovar seu ambiente",
            adSetExternalId: "120246723865450701",
            adSetName: "[CJ] [PUB-ABERTO] [WHATSAPP]",
            spendBrl: 1.39,
            impressions: 195,
            clicks: 1,
            reach: 140,
            purchasesValueBrl: 0,
          },
          {
            externalId: "120246724508160701",
            name: "AD - Precisa resolver a lista de material",
            adSetExternalId: "120246723865450701",
            adSetName: "[CJ] [PUB-ABERTO] [WHATSAPP]",
            spendBrl: 1.24,
            impressions: 264,
            clicks: 1,
            reach: 201,
            purchasesValueBrl: 0,
          },
        ],
      },
    ],
  },
];

const CURRENT_PERIOD_DATE = new Date("2026-08-28T00:00:00Z");
const PREVIOUS_PERIOD_DATE = new Date("2026-07-29T00:00:00Z");
const PLATFORM: Platform = "META_ADS";

async function main() {
  const passwordHash = await hashPassword(REAL_CLIENT_PASSWORD);

  for (const spec of REAL_CLIENTS) {
    const existing = await prisma.client.findFirst({ where: { company: spec.company } });
    if (existing) {
      console.log(`Skipping "${spec.company}" — already imported.`);
      continue;
    }

    console.log(`Importing real client "${spec.company}"...`);
    const client = await prisma.client.create({
      data: {
        name: spec.name,
        company: spec.company,
        status: "ACTIVE",
        users: { create: { name: spec.name, email: spec.email, passwordHash, role: "CLIENT" } },
      },
    });

    // Google Ads account shell — connected in the MCC, campaigns pending re-auth (see header comment).
    await prisma.adAccount.create({
      data: {
        clientId: client.id,
        platform: "GOOGLE_ADS",
        externalId: spec.googleCustomerId,
        name: `${spec.company} — Google Ads`,
        currency: "BRL",
        dataSource: "REAL",
      },
    });

    const metaAccount = await prisma.adAccount.create({
      data: {
        clientId: client.id,
        platform: "META_ADS",
        externalId: spec.metaAdAccountId,
        name: `${spec.metaAccountName} — Meta Ads`,
        currency: "BRL",
        dataSource: "REAL",
        lastSyncAt: new Date(),
      },
    });

    for (const c of spec.campaigns) {
      const campaign = await prisma.campaign.create({
        data: {
          adAccountId: metaAccount.id,
          externalId: c.externalId,
          name: c.name,
          status: "ENABLED",
          objective: c.objective,
          dataSource: "REAL",
        },
      });

      const adSetCache = new Map<string, string>();
      const totalSpend = c.ads.reduce((s, a) => s + a.spendBrl, 0) || 1;

      for (const ad of c.ads) {
        let adGroupId = adSetCache.get(ad.adSetExternalId);
        if (!adGroupId) {
          const adGroup = await prisma.adGroup.create({
            data: {
              campaignId: campaign.id,
              externalId: ad.adSetExternalId,
              name: ad.adSetName,
              status: "ENABLED",
              dataSource: "REAL",
            },
          });
          adGroupId = adGroup.id;
          adSetCache.set(ad.adSetExternalId, adGroupId);
        }

        const createdAd = await prisma.ad.create({
          data: {
            campaignId: campaign.id,
            adGroupId,
            externalId: ad.externalId,
            name: ad.name,
            status: "ENABLED",
            headline: ad.name,
            creativeType: "IMAGE",
            dataSource: "REAL",
          },
        });

        await prisma.metric.create({
          data: {
            date: CURRENT_PERIOD_DATE,
            adAccountId: metaAccount.id,
            campaignId: campaign.id,
            adGroupId,
            adId: createdAd.id,
            platform: PLATFORM,
            dataSource: "REAL",
            impressions: ad.impressions,
            clicks: ad.clicks,
            costBrl: ad.spendBrl,
            conversions: 0,
            conversionValueBrl: ad.purchasesValueBrl,
            reach: ad.reach,
            leads: 0,
          },
        });

        if (c.previousPeriod) {
          const share = ad.spendBrl / totalSpend;
          await prisma.metric.create({
            data: {
              date: PREVIOUS_PERIOD_DATE,
              adAccountId: metaAccount.id,
              campaignId: campaign.id,
              adGroupId,
              adId: createdAd.id,
              platform: PLATFORM,
              dataSource: "REAL",
              impressions: Math.round(c.previousPeriod.impressions * share),
              clicks: Math.round(c.previousPeriod.clicks * share),
              costBrl: Number((c.previousPeriod.spendBrl * share).toFixed(2)),
              conversions: 0,
              conversionValueBrl: 0,
              reach: 0,
              leads: 0,
            },
          });
        }
      }
    }
  }

  console.log("\nReal-data import completed.");
  console.log(`Real client logins: ${REAL_CLIENTS.map((c) => c.email).join(", ")} / ${REAL_CLIENT_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
