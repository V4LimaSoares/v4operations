-- AlterTable
ALTER TABLE "HealthScoreEntry" ADD COLUMN     "analysisFrequency" TEXT,
ADD COLUMN     "contractLink" TEXT,
ADD COLUMN     "driveLink" TEXT,
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "paidMediaInvestmentBrl" DOUBLE PRECISION;
