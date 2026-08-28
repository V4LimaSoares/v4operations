import type { Platform } from "@prisma/client";

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function randInt(min: number, max: number) {
  return Math.round(rand(min, max));
}

export type DailyMetricInput = {
  platform: Platform;
  /** relative size of the entity, 0.2 (small) .. 1.5 (large account) */
  scale?: number;
  /** 0..1, chance the day performed particularly well (drives conversion rate up) */
  qualityBias?: number;
};

/** Generates one plausible day of ad metrics for demo data — not tied to any real account. */
export function randomDailyMetric({ platform, scale = 1, qualityBias = 0.5 }: DailyMetricInput) {
  const impressions = Math.round(randInt(400, 6000) * scale);
  const ctr = platform === "GOOGLE_ADS" ? rand(0.015, 0.06) : rand(0.008, 0.035);
  const clicks = Math.max(0, Math.round(impressions * ctr * rand(0.7, 1.3)));

  const cpc = platform === "GOOGLE_ADS" ? rand(0.6, 3.2) : rand(0.3, 2.1);
  const costBrl = Number((clicks * cpc).toFixed(2));

  const convRate = rand(0.01, 0.06) * (0.6 + qualityBias);
  const conversions = Number((clicks * convRate).toFixed(2));

  const avgTicket = rand(80, 420);
  const conversionValueBrl = Number((conversions * avgTicket * rand(0.85, 1.25)).toFixed(2));

  const reach = platform === "META_ADS" ? Math.round(impressions / rand(1.1, 1.8)) : null;
  const leads = platform === "META_ADS" ? Math.round(conversions * rand(0.8, 1.4)) : null;

  return { impressions, clicks, costBrl, conversions, conversionValueBrl, reach, leads };
}

export function splitAcrossChildren<T>(children: T[], metric: ReturnType<typeof randomDailyMetric>) {
  if (children.length === 0) return [];
  const weights = children.map(() => rand(0.4, 1.6));
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  return children.map((child, i) => {
    const share = weights[i] / totalWeight;
    return {
      child,
      metric: {
        impressions: Math.round(metric.impressions * share),
        clicks: Math.round(metric.clicks * share),
        costBrl: Number((metric.costBrl * share).toFixed(2)),
        conversions: Number((metric.conversions * share).toFixed(2)),
        conversionValueBrl: Number((metric.conversionValueBrl * share).toFixed(2)),
        reach: metric.reach ? Math.round(metric.reach * share) : null,
        leads: metric.leads ? Math.round(metric.leads * share) : null,
      },
    };
  });
}
