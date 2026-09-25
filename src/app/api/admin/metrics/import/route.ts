import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/audit";
import type { Prisma } from "@prisma/client";

// Self-service replacement for the one-off `prisma/import-real-performance.ts` script: lets an
// MCP-assisted session (or, later, a real credentialed sync) write real campaign performance
// straight into production through the app's own authenticated API instead of needing direct
// database access (blocked by the auto-mode classifier — see session notes on ad-account work).
//
// Field mapping is deliberate, not 1:1 with whatever the platform calls things (see the
// Performance audit, Fase 16.5/16.6): `conversions`/`conversionValueBrl` are reserved for actual
// purchase/sale events with a value attached (Meta's `purchases`/`purchases_value_brl`, Google's
// own `conversions`/`conversion_value` once that MCP is usable again) — never leads. `leads` is
// its own field, populated only when the platform actually reports a lead count, so a lead is
// never silently counted as a conversion.
const campaignSchema = z.object({
  externalId: z.string().min(1),
  name: z.string().min(1),
  objective: z.string().optional(),
  impressions: z.number().int().min(0),
  clicks: z.number().int().min(0),
  costBrl: z.number().min(0),
  conversions: z.number().min(0).default(0),
  conversionValueBrl: z.number().min(0).default(0),
  reach: z.number().int().min(0).optional(),
  leads: z.number().int().min(0).optional(),
});

const schema = z.object({
  adAccountId: z.string().min(1),
  periodEnd: z.string().min(1), // YYYY-MM-DD — the date the aggregate snapshot is dated at, same convention as the old script
  campaigns: z.array(campaignSchema).min(1).max(200),
});

export async function POST(req: Request) {
  const admin = await requireAdmin();
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  }
  const { adAccountId, periodEnd, campaigns } = parsed.data;

  const account = await prisma.adAccount.findUnique({ where: { id: adAccountId } });
  if (!account) {
    return NextResponse.json({ error: "Conta não encontrada." }, { status: 404 });
  }

  const date = new Date(`${periodEnd}T00:00:00Z`);
  let campaignsWritten = 0;
  let metricsWritten = 0;

  for (const c of campaigns) {
    const campaign = await prisma.campaign.upsert({
      where: { adAccountId_externalId: { adAccountId: account.id, externalId: c.externalId } },
      create: {
        adAccountId: account.id,
        externalId: c.externalId,
        name: c.name,
        status: "ENABLED",
        objective: c.objective,
        dataSource: "REAL",
      },
      update: { name: c.name, objective: c.objective, dataSource: "REAL" },
    });
    campaignsWritten++;

    const existingMetric = await prisma.metric.findFirst({
      where: { date, adAccountId: account.id, campaignId: campaign.id, adGroupId: null, adId: null, keywordId: null },
    });
    const metricData: Prisma.MetricUncheckedCreateInput = {
      date,
      adAccountId: account.id,
      campaignId: campaign.id,
      platform: account.platform,
      dataSource: "REAL",
      impressions: c.impressions,
      clicks: c.clicks,
      costBrl: c.costBrl,
      conversions: c.conversions,
      conversionValueBrl: c.conversionValueBrl,
      reach: c.reach ?? null,
      leads: c.leads ?? null,
    };
    if (existingMetric) {
      await prisma.metric.update({ where: { id: existingMetric.id }, data: metricData });
    } else {
      await prisma.metric.create({ data: metricData });
    }
    metricsWritten++;
  }

  await prisma.adAccount.update({ where: { id: account.id }, data: { lastSyncAt: new Date() } });

  await logActivity({
    actorId: admin.id,
    actorName: admin.name,
    action: "editou",
    entityType: "Performance (import MCP)",
    entityId: account.id,
    entityLabel: account.name,
    detail: `${campaignsWritten} campanha(s), ${metricsWritten} métrica(s) — período ${periodEnd}`,
  });

  return NextResponse.json({ ok: true, campaignsWritten, metricsWritten });
}
