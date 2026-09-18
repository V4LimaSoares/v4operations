-- AlterTable
ALTER TABLE "HealthScoreEntry" ADD COLUMN     "accountOwner" TEXT,
ADD COLUMN     "nextCheckin" TIMESTAMP(3);
