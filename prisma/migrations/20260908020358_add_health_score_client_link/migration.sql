-- AlterTable
ALTER TABLE "HealthScoreEntry" ADD COLUMN     "clientId" TEXT;

-- CreateIndex
CREATE INDEX "HealthScoreEntry_clientId_idx" ON "HealthScoreEntry"("clientId");

-- AddForeignKey
ALTER TABLE "HealthScoreEntry" ADD CONSTRAINT "HealthScoreEntry_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
