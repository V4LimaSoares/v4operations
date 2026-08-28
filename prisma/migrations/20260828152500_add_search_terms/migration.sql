-- CreateEnum
CREATE TYPE "SearchTermStatus" AS ENUM ('NONE', 'ADDED', 'EXCLUDED');

-- CreateTable
CREATE TABLE "SearchTerm" (
    "id" TEXT NOT NULL,
    "adAccountId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "adGroupId" TEXT,
    "text" TEXT NOT NULL,
    "status" "SearchTermStatus" NOT NULL DEFAULT 'NONE',
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "costBrl" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "conversions" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "conversionValueBrl" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "dataSource" "DataSource" NOT NULL DEFAULT 'DEMO',
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchTerm_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SearchTerm_adAccountId_idx" ON "SearchTerm"("adAccountId");

-- CreateIndex
CREATE INDEX "SearchTerm_campaignId_idx" ON "SearchTerm"("campaignId");

-- AddForeignKey
ALTER TABLE "SearchTerm" ADD CONSTRAINT "SearchTerm_adAccountId_fkey" FOREIGN KEY ("adAccountId") REFERENCES "AdAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchTerm" ADD CONSTRAINT "SearchTerm_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchTerm" ADD CONSTRAINT "SearchTerm_adGroupId_fkey" FOREIGN KEY ("adGroupId") REFERENCES "AdGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
