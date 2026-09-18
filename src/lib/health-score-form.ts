import type { HealthScoreEntry } from "@prisma/client";

/** Plain data shape shared between the create/edit dialog (client) and the pages that render it
 *  (server) — kept in its own module (no "use client"/"server-only") so both sides can import it
 *  without crossing an RSC boundary. */
export type HealthScoreFormEntry = {
  id?: string;
  clientName: string;
  clientId: string | null;
  phase: string;
  productCategory: string | null;
  product: string | null;
  feeBrl: number | null;
  projectStart: string | null;
  leadTimeMonths: number | null;
  replanDate: string | null;
  lastUpdate: string | null;
  contributionMarginPct: number | null;
  roi: number | null;
  revenueGoalBrl: number | null;
  revenueAchievedBrl: number | null;
  investmentGoalBrl: number | null;
  investmentAchievedBrl: number | null;
  planningLink: string | null;
  kpiGoal: string | null;
  kpiPartial: string | null;
  kpiAchieved: boolean | null;
  stakeholderRelationship: string | null;
  flag: string | null;
  hsUpToDate: string | null;
  accountOwner: string | null;
  nextCheckin: string | null;
  checklist: Record<string, string> | null;
  growth: string | null;
  churnProbabilityPct: number | null;
  fact: string | null;
  cause: string | null;
  action: string | null;
  notes: string | null;
  endDate: string | null;
  contractLink: string | null;
  analysisFrequency: string | null;
  paidMediaInvestmentBrl: number | null;
  driveLink: string | null;
};

export const EMPTY_HEALTH_SCORE_FORM_ENTRY: HealthScoreFormEntry = {
  clientName: "",
  clientId: null,
  phase: "ONGOING",
  productCategory: null,
  product: null,
  feeBrl: null,
  projectStart: null,
  leadTimeMonths: null,
  replanDate: null,
  lastUpdate: null,
  contributionMarginPct: null,
  roi: null,
  revenueGoalBrl: null,
  revenueAchievedBrl: null,
  investmentGoalBrl: null,
  investmentAchievedBrl: null,
  planningLink: null,
  kpiGoal: null,
  kpiPartial: null,
  kpiAchieved: null,
  stakeholderRelationship: null,
  flag: null,
  hsUpToDate: null,
  accountOwner: null,
  nextCheckin: null,
  checklist: null,
  growth: null,
  churnProbabilityPct: null,
  fact: null,
  cause: null,
  action: null,
  notes: null,
  endDate: null,
  contractLink: null,
  analysisFrequency: null,
  paidMediaInvestmentBrl: null,
  driveLink: null,
};

/** Converts a Prisma row (Date objects) into the dialog's form shape (ISO strings) — used by
 *  every page that lists Health Score entries and opens the edit dialog for one. */
export function toHealthScoreFormEntry(e: HealthScoreEntry): HealthScoreFormEntry {
  return {
    id: e.id,
    clientName: e.clientName,
    clientId: e.clientId,
    phase: e.phase,
    productCategory: e.productCategory,
    product: e.product,
    feeBrl: e.feeBrl,
    projectStart: e.projectStart ? e.projectStart.toISOString() : null,
    leadTimeMonths: e.leadTimeMonths,
    replanDate: e.replanDate ? e.replanDate.toISOString() : null,
    lastUpdate: e.lastUpdate ? e.lastUpdate.toISOString() : null,
    contributionMarginPct: e.contributionMarginPct,
    roi: e.roi,
    revenueGoalBrl: e.revenueGoalBrl,
    revenueAchievedBrl: e.revenueAchievedBrl,
    investmentGoalBrl: e.investmentGoalBrl,
    investmentAchievedBrl: e.investmentAchievedBrl,
    planningLink: e.planningLink,
    kpiGoal: e.kpiGoal,
    kpiPartial: e.kpiPartial,
    kpiAchieved: e.kpiAchieved,
    stakeholderRelationship: e.stakeholderRelationship,
    flag: e.flag,
    hsUpToDate: e.hsUpToDate,
    accountOwner: e.accountOwner,
    nextCheckin: e.nextCheckin ? e.nextCheckin.toISOString() : null,
    checklist: (e.checklist as Record<string, string> | null) ?? null,
    growth: e.growth,
    churnProbabilityPct: e.churnProbabilityPct,
    fact: e.fact,
    cause: e.cause,
    action: e.action,
    notes: e.notes,
    endDate: e.endDate ? e.endDate.toISOString() : null,
    contractLink: e.contractLink,
    analysisFrequency: e.analysisFrequency,
    paidMediaInvestmentBrl: e.paidMediaInvestmentBrl,
    driveLink: e.driveLink,
  };
}
