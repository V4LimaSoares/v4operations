/**
 * One-off import of real campaign-level performance (last 30 days) for the `AdAccount`s that
 * `link-real-ad-accounts.ts` just wired up. Fetched live via the Meta Ads MCP
 * (mcp__v4-ads__meta_get_campaign_performance) during a Claude Code session on 2026-09-09 — same
 * "MCP-assisted sync" pattern as import-real-data.ts.
 *
 * Google Ads campaigns could NOT be imported this run: mcp__v4-ads__get_campaign_performance
 * returned "Falha de autenticação com o Google Ads — a conexão OAuth do gestor pode ter sido
 * revogada" for every account (same failure already documented in import-real-data.ts from
 * 2026-08-28 — still unresolved a rodada seguinte). The Google `AdAccount` rows created by
 * link-real-ad-accounts.ts stay real but campaign-less until OAuth is reconnected and this script
 * is extended with a GOOGLE_CAMPAIGNS snapshot the same way META_CAMPAIGNS is below.
 *
 * Writes one Metric row per campaign, dated at the period end, holding the 30-day aggregate —
 * matching the granularity import-real-data.ts already established (a real snapshot, not a full
 * daily series; Google Ads' own daily breakdown was out of scope for this pass).
 *
 * Safe to re-run: campaigns are upserted by (adAccountId, externalId); the metric snapshot for a
 * given (adAccountId, campaignId, date) is updated in place rather than duplicated.
 */
import { PrismaClient, type Platform } from "@prisma/client";

const prisma = new PrismaClient();

const PERIOD_END = new Date("2026-09-09T00:00:00Z"); // date_range.end returned by every MCP call below
const PLATFORM: Platform = "META_ADS";

type RealCampaign = {
  campaign_id: string;
  campaign_name: string;
  objective: string;
  spend_brl: number;
  impressions: number;
  clicks: number;
  reach: number;
  purchases_value_brl: number;
  leads: number;
};

// Snapshot from mcp__v4-ads__meta_get_campaign_performance (date_range LAST_30_DAYS, 2026-08-11..2026-09-09),
// keyed by the Meta ad_account_id already linked to a Client via link-real-ad-accounts.ts.
// Accounts that returned zero rows (no spend in the period) are simply absent here — nothing to write.
const META_CAMPAIGNS: Record<string, RealCampaign[]> = {
  act_760944201482985: [
    { campaign_id: "120246723865440701", campaign_name: "[CP] [V4] [ENGAJAMENTO] [WHATSAPP] [01]", objective: "OUTCOME_ENGAGEMENT", spend_brl: 650.2, impressions: 109699, clicks: 1010, reach: 19867, purchases_value_brl: 0, leads: 0 },
  ],
  act_1662777044536224: [
    { campaign_id: "120253503513430385", campaign_name: "[CP] [ENGAJAMENTO] [WHATSAPP] [01]", objective: "OUTCOME_ENGAGEMENT", spend_brl: 398.1, impressions: 33338, clicks: 275, reach: 11541, purchases_value_brl: 0, leads: 0 },
  ],
  act_4051924171730156: [
    { campaign_id: "120243732496500569", campaign_name: "[CP] [ENGAJAMENTO] [PROFISSIONAIS] [INDICAÇÃO]", objective: "OUTCOME_ENGAGEMENT", spend_brl: 724.74, impressions: 82045, clicks: 1065, reach: 25430, purchases_value_brl: 0, leads: 0 },
    { campaign_id: "120246869966370569", campaign_name: "[CP] [ENGAJAMENTO] [REMARKETING]", objective: "OUTCOME_ENGAGEMENT", spend_brl: 437.21, impressions: 19736, clicks: 297, reach: 744, purchases_value_brl: 0, leads: 0 },
    { campaign_id: "120255563212770569", campaign_name: "[CP] [ENGAJAMENTO] [PROCEDIMENTOS]", objective: "OUTCOME_ENGAGEMENT", spend_brl: 303.48, impressions: 25597, clicks: 1036, reach: 11813, purchases_value_brl: 0, leads: 0 },
    { campaign_id: "120246896801970569", campaign_name: "[CP] [V4] [TRÁFEGO PARA O PERFIL]", objective: "LINK_CLICKS", spend_brl: 290.2, impressions: 43137, clicks: 3481, reach: 34279, purchases_value_brl: 0, leads: 0 },
  ],
  act_1479232423809572: [
    { campaign_id: "120248789712950637", campaign_name: "[CP] [V4] [ENGAJAMENTO] [WHATSAPP] [02]", objective: "OUTCOME_ENGAGEMENT", spend_brl: 460.84, impressions: 42797, clicks: 433, reach: 14159, purchases_value_brl: 0, leads: 0 },
    { campaign_id: "120249530008670637", campaign_name: "[CP] [V4] [TRÁFEGO PARA O PERFIL]", objective: "LINK_CLICKS", spend_brl: 19.91, impressions: 3485, clicks: 60, reach: 3313, purchases_value_brl: 0, leads: 0 },
  ],
  act_1742450026462797: [
    { campaign_id: "120249976565770121", campaign_name: "[CP] [ENGAJAMENTO] [WHATSAPP] [MARMORE] [04]", objective: "OUTCOME_ENGAGEMENT", spend_brl: 348.33, impressions: 26561, clicks: 222, reach: 9920, purchases_value_brl: 0, leads: 0 },
  ],
  act_1489398022911451: [
    { campaign_id: "120250153303790493", campaign_name: "[CP] [ENGAJAMENTO] [WHATSAPP] [01]", objective: "OUTCOME_ENGAGEMENT", spend_brl: 153.82, impressions: 5405, clicks: 63, reach: 910, purchases_value_brl: 0, leads: 0 },
  ],
  act_1633821681199707: [
    { campaign_id: "52597692829151", campaign_name: "[CP] [V4] [ALCANCE] [NOVA UNIDADE]", objective: "OUTCOME_AWARENESS", spend_brl: 303.13, impressions: 191189, clicks: 234, reach: 70297, purchases_value_brl: 0, leads: 0 },
    { campaign_id: "52505329255951", campaign_name: "[CP] [V4] [TRÁFEGO PARA O PERFIL]", objective: "LINK_CLICKS", spend_brl: 285.62, impressions: 36390, clicks: 643, reach: 18256, purchases_value_brl: 0, leads: 0 },
  ],
  act_24879253358328154: [
    { campaign_id: "120244779492050313", campaign_name: "[CP] [V4] [TRAFEGO PARA O PERFIL]", objective: "LINK_CLICKS", spend_brl: 290.83, impressions: 46180, clicks: 844, reach: 38039, purchases_value_brl: 0, leads: 0 },
  ],
  act_4222737191315302: [
    { campaign_id: "120247228288200380", campaign_name: "[CP] [VAGAS] [LOCAPALMAS]", objective: "OUTCOME_ENGAGEMENT", spend_brl: 87.83, impressions: 8849, clicks: 172, reach: 3935, purchases_value_brl: 0, leads: 0 },
  ],
  act_561651589590879: [
    { campaign_id: "120249277808150761", campaign_name: "[VP] [V4] [ENGAJAMENTO] [WHATSAPP]", objective: "OUTCOME_ENGAGEMENT", spend_brl: 531.62, impressions: 66474, clicks: 592, reach: 13084, purchases_value_brl: 0, leads: 0 },
  ],
};

async function main() {
  let campaignsWritten = 0;
  let metricsWritten = 0;

  for (const [externalId, campaigns] of Object.entries(META_CAMPAIGNS)) {
    const account = await prisma.adAccount.findUnique({ where: { platform_externalId: { platform: PLATFORM, externalId } } });
    if (!account) {
      console.log(`AVISO  conta ${externalId} não encontrada (rode link-real-ad-accounts.ts primeiro) — pulei.`);
      continue;
    }

    for (const c of campaigns) {
      const campaign = await prisma.campaign.upsert({
        where: { adAccountId_externalId: { adAccountId: account.id, externalId: c.campaign_id } },
        create: {
          adAccountId: account.id,
          externalId: c.campaign_id,
          name: c.campaign_name,
          status: "ENABLED",
          objective: c.objective,
          dataSource: "REAL",
        },
        update: { name: c.campaign_name, objective: c.objective, dataSource: "REAL" },
      });
      campaignsWritten++;

      const existingMetric = await prisma.metric.findFirst({
        where: { date: PERIOD_END, adAccountId: account.id, campaignId: campaign.id, adGroupId: null, adId: null, keywordId: null },
      });
      const metricData = {
        date: PERIOD_END,
        adAccountId: account.id,
        campaignId: campaign.id,
        platform: PLATFORM,
        dataSource: "REAL" as const,
        impressions: c.impressions,
        clicks: c.clicks,
        costBrl: c.spend_brl,
        conversions: 0,
        conversionValueBrl: c.purchases_value_brl,
        reach: c.reach,
        leads: c.leads,
      };
      if (existingMetric) {
        await prisma.metric.update({ where: { id: existingMetric.id }, data: metricData });
      } else {
        await prisma.metric.create({ data: metricData });
      }
      metricsWritten++;
    }

    await prisma.adAccount.update({ where: { id: account.id }, data: { lastSyncAt: new Date() } });
    console.log(`OK  ${account.name} — ${campaigns.length} campanha(s) real(is) gravada(s).`);
  }

  console.log(`\nConcluído. ${campaignsWritten} campanhas, ${metricsWritten} métricas gravadas.`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
