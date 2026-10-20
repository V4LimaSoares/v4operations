-- CreateTable
CREATE TABLE "SlaSnapshot" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "takenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "level" TEXT NOT NULL,

    CONSTRAINT "SlaSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SlaSnapshot_clientId_takenAt_idx" ON "SlaSnapshot"("clientId", "takenAt");

-- AddForeignKey
ALTER TABLE "SlaSnapshot" ADD CONSTRAINT "SlaSnapshot_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
