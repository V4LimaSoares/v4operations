-- CreateTable
CREATE TABLE "HealthScoreEntry" (
    "id" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "phase" TEXT NOT NULL DEFAULT 'ONGOING',
    "productCategory" TEXT,
    "product" TEXT,
    "feeBrl" DOUBLE PRECISION,
    "projectStart" TIMESTAMP(3),
    "leadTimeMonths" INTEGER,
    "replanDate" TIMESTAMP(3),
    "lastUpdate" TIMESTAMP(3),
    "contributionMarginPct" DOUBLE PRECISION,
    "roi" DOUBLE PRECISION,
    "revenueGoalBrl" DOUBLE PRECISION,
    "revenueAchievedBrl" DOUBLE PRECISION,
    "investmentGoalBrl" DOUBLE PRECISION,
    "investmentAchievedBrl" DOUBLE PRECISION,
    "planningLink" TEXT,
    "kpiGoal" TEXT,
    "kpiPartial" TEXT,
    "kpiAchieved" BOOLEAN,
    "stakeholderRelationship" TEXT,
    "flag" TEXT,
    "hsUpToDate" TEXT,
    "checklist" JSONB,
    "growth" TEXT,
    "churnProbabilityPct" DOUBLE PRECISION,
    "fact" TEXT,
    "cause" TEXT,
    "action" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthScoreEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HealthScoreEntry_clientName_idx" ON "HealthScoreEntry"("clientName");
