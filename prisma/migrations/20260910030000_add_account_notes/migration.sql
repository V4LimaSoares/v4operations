-- CreateTable
CREATE TABLE "AccountNote" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "authorId" TEXT,
    "type" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AccountNote_clientId_occurredAt_idx" ON "AccountNote"("clientId", "occurredAt");

-- AddForeignKey
ALTER TABLE "AccountNote" ADD CONSTRAINT "AccountNote_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountNote" ADD CONSTRAINT "AccountNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
