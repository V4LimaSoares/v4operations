-- CreateTable
CREATE TABLE "FunnelStage" (
    "id" TEXT NOT NULL,
    "adAccountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "conversions" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "dataSource" "DataSource" NOT NULL DEFAULT 'DEMO',
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FunnelStage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FunnelStage_adAccountId_order_idx" ON "FunnelStage"("adAccountId", "order");

-- AddForeignKey
ALTER TABLE "FunnelStage" ADD CONSTRAINT "FunnelStage_adAccountId_fkey" FOREIGN KEY ("adAccountId") REFERENCES "AdAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
