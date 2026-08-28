import type { SearchTermStatus } from "@prisma/client";

const PREFIXES = ["comprar", "melhor", "onde comprar", "preço", ""];
const SUFFIXES = ["perto de mim", "avaliações", "promoção", "barato", "online", ""];

/** Derives a handful of plausible real search queries from a bid keyword (demo data only). */
export function generateSearchTermVariants(keywordText: string, count = 3): string[] {
  const variants = new Set<string>();
  variants.add(keywordText);
  let guard = 0;
  while (variants.size < count && guard < 20) {
    guard++;
    const prefix = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];
    const suffix = SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)];
    const parts = [prefix, keywordText, suffix].filter(Boolean);
    variants.add(parts.join(" "));
  }
  return Array.from(variants).slice(0, count);
}

const STATUS_WEIGHTS: [SearchTermStatus, number][] = [
  ["NONE", 0.65],
  ["ADDED", 0.2],
  ["EXCLUDED", 0.15],
];

export function randomSearchTermStatus(): SearchTermStatus {
  const r = Math.random();
  let acc = 0;
  for (const [status, weight] of STATUS_WEIGHTS) {
    acc += weight;
    if (r <= acc) return status;
  }
  return "NONE";
}

export function randomSearchTermMetric(baseCostBrl: number) {
  const impressions = Math.max(1, Math.round(baseCostBrl * (5 + Math.random() * 25)));
  const ctr = 0.02 + Math.random() * 0.08;
  const clicks = Math.max(0, Math.round(impressions * ctr));
  const cpc = 0.4 + Math.random() * 3;
  const costBrl = Number((clicks * cpc).toFixed(2));
  const conversions = Number((clicks * (Math.random() * 0.1)).toFixed(2));
  const conversionValueBrl = Number((conversions * (80 + Math.random() * 300)).toFixed(2));
  return { impressions, clicks, costBrl, conversions, conversionValueBrl };
}
