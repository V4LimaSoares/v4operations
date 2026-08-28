-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'CLIENT');

-- CreateEnum
CREATE TYPE "ClientStatus" AS ENUM ('ACTIVE', 'PAUSED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('GOOGLE_ADS', 'META_ADS');

-- CreateEnum
CREATE TYPE "DataSource" AS ENUM ('DEMO', 'REAL');

-- CreateEnum
CREATE TYPE "EntityStatus" AS ENUM ('ENABLED', 'PAUSED', 'REMOVED');

-- CreateEnum
CREATE TYPE "InsightCategory" AS ENUM ('OPPORTUNITY', 'PROBLEM', 'ATTENTION', 'HIGHLIGHT');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('RUNNING', 'SUCCESS', 'ERROR');

-- CreateEnum
CREATE TYPE "RevenueSource" AS ENUM ('MANUAL', 'INTEGRATION');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CLIENT',
    "clientId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sessionVersion" INTEGER NOT NULL DEFAULT 0,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "status" "ClientStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdAccount" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "externalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "timezone" TEXT,
    "dataSource" "DataSource" NOT NULL DEFAULT 'DEMO',
    "status" "EntityStatus" NOT NULL DEFAULT 'ENABLED',
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSyncAt" TIMESTAMP(3),

    CONSTRAINT "AdAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "adAccountId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "EntityStatus" NOT NULL DEFAULT 'ENABLED',
    "objective" TEXT,
    "budgetDailyBrl" DECIMAL(14,2),
    "dataSource" "DataSource" NOT NULL DEFAULT 'DEMO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdGroup" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "EntityStatus" NOT NULL DEFAULT 'ENABLED',
    "dataSource" "DataSource" NOT NULL DEFAULT 'DEMO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ad" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "adGroupId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "EntityStatus" NOT NULL DEFAULT 'ENABLED',
    "headline" TEXT,
    "description" TEXT,
    "imageUrl" TEXT,
    "creativeType" TEXT,
    "dataSource" "DataSource" NOT NULL DEFAULT 'DEMO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Keyword" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "adGroupId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "matchType" TEXT NOT NULL,
    "status" "EntityStatus" NOT NULL DEFAULT 'ENABLED',
    "qualityScore" INTEGER,
    "dataSource" "DataSource" NOT NULL DEFAULT 'DEMO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Keyword_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Metric" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "adAccountId" TEXT NOT NULL,
    "campaignId" TEXT,
    "adGroupId" TEXT,
    "adId" TEXT,
    "keywordId" TEXT,
    "platform" "Platform" NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "costBrl" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "conversions" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "conversionValueBrl" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "reach" INTEGER,
    "frequency" DOUBLE PRECISION,
    "videoViews" INTEGER,
    "leads" INTEGER,
    "dataSource" "DataSource" NOT NULL DEFAULT 'DEMO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Metric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevenueEntry" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "amountBrl" DECIMAL(14,2) NOT NULL,
    "source" "RevenueSource" NOT NULL DEFAULT 'MANUAL',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RevenueEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Insight" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "category" "InsightCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "platform" "Platform",
    "dataSource" "DataSource" NOT NULL DEFAULT 'DEMO',
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dismissed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Insight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncLog" (
    "id" TEXT NOT NULL,
    "adAccountId" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "status" "SyncStatus" NOT NULL DEFAULT 'RUNNING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "recordsSynced" INTEGER,
    "errorMessage" TEXT,
    "triggeredById" TEXT,
    "triggeredByLabel" TEXT,
    "dataSource" "DataSource" NOT NULL DEFAULT 'DEMO',

    CONSTRAINT "SyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_clientId_idx" ON "User"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- CreateIndex
CREATE INDEX "Client_status_idx" ON "Client"("status");

-- CreateIndex
CREATE INDEX "AdAccount_clientId_idx" ON "AdAccount"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "AdAccount_platform_externalId_key" ON "AdAccount"("platform", "externalId");

-- CreateIndex
CREATE INDEX "Campaign_adAccountId_idx" ON "Campaign"("adAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Campaign_adAccountId_externalId_key" ON "Campaign"("adAccountId", "externalId");

-- CreateIndex
CREATE INDEX "AdGroup_campaignId_idx" ON "AdGroup"("campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "AdGroup_campaignId_externalId_key" ON "AdGroup"("campaignId", "externalId");

-- CreateIndex
CREATE INDEX "Ad_campaignId_idx" ON "Ad"("campaignId");

-- CreateIndex
CREATE INDEX "Ad_adGroupId_idx" ON "Ad"("adGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "Ad_adGroupId_externalId_key" ON "Ad"("adGroupId", "externalId");

-- CreateIndex
CREATE INDEX "Keyword_campaignId_idx" ON "Keyword"("campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "Keyword_adGroupId_externalId_key" ON "Keyword"("adGroupId", "externalId");

-- CreateIndex
CREATE INDEX "Metric_adAccountId_date_idx" ON "Metric"("adAccountId", "date");

-- CreateIndex
CREATE INDEX "Metric_campaignId_date_idx" ON "Metric"("campaignId", "date");

-- CreateIndex
CREATE INDEX "Metric_adGroupId_date_idx" ON "Metric"("adGroupId", "date");

-- CreateIndex
CREATE INDEX "Metric_adId_date_idx" ON "Metric"("adId", "date");

-- CreateIndex
CREATE INDEX "Metric_keywordId_date_idx" ON "Metric"("keywordId", "date");

-- CreateIndex
CREATE INDEX "Metric_date_idx" ON "Metric"("date");

-- CreateIndex
CREATE INDEX "RevenueEntry_clientId_date_idx" ON "RevenueEntry"("clientId", "date");

-- CreateIndex
CREATE INDEX "Insight_clientId_generatedAt_idx" ON "Insight"("clientId", "generatedAt");

-- CreateIndex
CREATE INDEX "SyncLog_adAccountId_startedAt_idx" ON "SyncLog"("adAccountId", "startedAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdAccount" ADD CONSTRAINT "AdAccount_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_adAccountId_fkey" FOREIGN KEY ("adAccountId") REFERENCES "AdAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdGroup" ADD CONSTRAINT "AdGroup_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ad" ADD CONSTRAINT "Ad_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ad" ADD CONSTRAINT "Ad_adGroupId_fkey" FOREIGN KEY ("adGroupId") REFERENCES "AdGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Keyword" ADD CONSTRAINT "Keyword_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Keyword" ADD CONSTRAINT "Keyword_adGroupId_fkey" FOREIGN KEY ("adGroupId") REFERENCES "AdGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metric" ADD CONSTRAINT "Metric_adAccountId_fkey" FOREIGN KEY ("adAccountId") REFERENCES "AdAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metric" ADD CONSTRAINT "Metric_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metric" ADD CONSTRAINT "Metric_adGroupId_fkey" FOREIGN KEY ("adGroupId") REFERENCES "AdGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metric" ADD CONSTRAINT "Metric_adId_fkey" FOREIGN KEY ("adId") REFERENCES "Ad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metric" ADD CONSTRAINT "Metric_keywordId_fkey" FOREIGN KEY ("keywordId") REFERENCES "Keyword"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueEntry" ADD CONSTRAINT "RevenueEntry_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Insight" ADD CONSTRAINT "Insight_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncLog" ADD CONSTRAINT "SyncLog_adAccountId_fkey" FOREIGN KEY ("adAccountId") REFERENCES "AdAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncLog" ADD CONSTRAINT "SyncLog_triggeredById_fkey" FOREIGN KEY ("triggeredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
