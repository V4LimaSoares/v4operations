/**
 * One-time import of the agency's Health Score spreadsheet (client account-health tracker) into
 * HealthScoreEntry. Source: prisma/health-score-import.json, pre-parsed from the Google Sheet.
 * Safe to re-run — clears existing rows first so re-running doesn't duplicate.
 */
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { join } from "path";

const prisma = new PrismaClient();

type ImportRow = {
  clientName: string;
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
  checklist: Record<string, string>;
  growth: string | null;
  churnProbabilityPct: number | null;
  fact: string | null;
  cause: string | null;
  action: string | null;
  notes: string | null;
};

async function main() {
  const raw = readFileSync(join(__dirname, "health-score-import.json"), "utf-8");
  const rows: ImportRow[] = JSON.parse(raw);

  await prisma.healthScoreEntry.deleteMany({});

  for (const row of rows) {
    await prisma.healthScoreEntry.create({
      data: {
        ...row,
        projectStart: row.projectStart ? new Date(row.projectStart) : null,
        replanDate: row.replanDate ? new Date(row.replanDate) : null,
        lastUpdate: row.lastUpdate ? new Date(row.lastUpdate) : null,
      },
    });
  }

  console.log(`Imported ${rows.length} Health Score entries.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
