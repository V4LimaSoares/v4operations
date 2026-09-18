-- AlterTable
ALTER TABLE "RecurringExpense"
  ADD COLUMN "percentage" DOUBLE PRECISION,
  ADD COLUMN "referralPercentage" DOUBLE PRECISION,
  ADD COLUMN "hireDate" TIMESTAMP(3),
  ADD COLUMN "terminationDate" TIMESTAMP(3),
  ADD COLUMN "isPartner" BOOLEAN NOT NULL DEFAULT false;
