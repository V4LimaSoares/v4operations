-- CreateTable
CREATE TABLE "EkyteIntegration" (
    "id" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OK',
    "errorMessage" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedByName" TEXT,

    CONSTRAINT "EkyteIntegration_pkey" PRIMARY KEY ("id")
);
