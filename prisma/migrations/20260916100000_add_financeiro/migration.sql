-- CreateEnum
CREATE TYPE "ExpenseKind" AS ENUM ('BILL', 'PROLABORE');

-- CreateEnum
CREATE TYPE "ExpenseStatus" AS ENUM ('PENDING', 'PAID');

-- CreateTable
CREATE TABLE "RecurringExpense" (
    "id" TEXT NOT NULL,
    "kind" "ExpenseKind" NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "amountBrl" DOUBLE PRECISION NOT NULL,
    "dayOfMonth" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "teamMemberId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecurringExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseInstance" (
    "id" TEXT NOT NULL,
    "recurringExpenseId" TEXT,
    "kind" "ExpenseKind" NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT,
    "amountBrl" DOUBLE PRECISION NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "status" "ExpenseStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExpenseInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxPayment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amountBrl" DOUBLE PRECISION NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "paidAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaxPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoyaltyConfig" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoyaltyConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecurringExpense_kind_idx" ON "RecurringExpense"("kind");

-- CreateIndex
CREATE INDEX "ExpenseInstance_kind_year_month_idx" ON "ExpenseInstance"("kind", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseInstance_recurringExpenseId_month_year_key" ON "ExpenseInstance"("recurringExpenseId", "month", "year");

-- CreateIndex
CREATE INDEX "TaxPayment_year_month_idx" ON "TaxPayment"("year", "month");

-- AddForeignKey
ALTER TABLE "RecurringExpense" ADD CONSTRAINT "RecurringExpense_teamMemberId_fkey" FOREIGN KEY ("teamMemberId") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseInstance" ADD CONSTRAINT "ExpenseInstance_recurringExpenseId_fkey" FOREIGN KEY ("recurringExpenseId") REFERENCES "RecurringExpense"("id") ON DELETE SET NULL ON UPDATE CASCADE;
