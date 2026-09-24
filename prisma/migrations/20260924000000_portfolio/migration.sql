-- CreateEnum
CREATE TYPE "PortfolioCategory" AS ENUM ('SABER', 'TER', 'EXECUTAR', 'DESTRAVA_RECEITA', 'POTENCIALIZAR');

-- CreateTable
CREATE TABLE "PortfolioItem" (
    "id" TEXT NOT NULL,
    "category" "PortfolioCategory" NOT NULL,
    "service" TEXT NOT NULL,
    "variation" TEXT,
    "valueBrl" DOUBLE PRECISION,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Ativo',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedByName" TEXT,

    CONSTRAINT "PortfolioItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientPortfolioItem" (
    "clientId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientPortfolioItem_pkey" PRIMARY KEY ("clientId","itemId")
);

-- CreateIndex
CREATE INDEX "PortfolioItem_category_idx" ON "PortfolioItem"("category");

-- CreateIndex
CREATE INDEX "ClientPortfolioItem_itemId_idx" ON "ClientPortfolioItem"("itemId");

-- AddForeignKey
ALTER TABLE "ClientPortfolioItem" ADD CONSTRAINT "ClientPortfolioItem_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientPortfolioItem" ADD CONSTRAINT "ClientPortfolioItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "PortfolioItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
