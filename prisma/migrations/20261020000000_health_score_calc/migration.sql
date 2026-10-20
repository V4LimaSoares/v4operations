-- CreateTable
CREATE TABLE "HealthScoreConfig" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "weights" JSONB NOT NULL,
    "healthyMin" INTEGER NOT NULL DEFAULT 75,
    "attentionMin" INTEGER NOT NULL DEFAULT 50,
    "newClientDays" INTEGER NOT NULL DEFAULT 30,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdByName" TEXT,

    CONSTRAINT "HealthScoreConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthSnapshot" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "score" INTEGER,
    "classification" TEXT NOT NULL,
    "partial" BOOLEAN NOT NULL DEFAULT false,
    "dimensions" JSONB NOT NULL,
    "configVersion" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HealthSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HealthScoreConfig_version_key" ON "HealthScoreConfig"("version");
CREATE UNIQUE INDEX "HealthSnapshot_clientId_day_key" ON "HealthSnapshot"("clientId", "day");
CREATE INDEX "HealthSnapshot_clientId_day_idx" ON "HealthSnapshot"("clientId", "day");

-- AddForeignKey
ALTER TABLE "HealthSnapshot" ADD CONSTRAINT "HealthSnapshot_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
