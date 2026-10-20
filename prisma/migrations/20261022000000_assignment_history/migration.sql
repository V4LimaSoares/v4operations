-- CreateTable
CREATE TABLE "AssignmentHistory" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "clientId" TEXT,
    "clientName" TEXT,
    "squadId" TEXT,
    "squadName" TEXT,
    "teamMemberId" TEXT,
    "memberName" TEXT,
    "role" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedByName" TEXT,

    CONSTRAINT "AssignmentHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AssignmentHistory_clientId_endedAt_idx" ON "AssignmentHistory"("clientId", "endedAt");
CREATE INDEX "AssignmentHistory_teamMemberId_endedAt_idx" ON "AssignmentHistory"("teamMemberId", "endedAt");
CREATE INDEX "AssignmentHistory_squadId_endedAt_idx" ON "AssignmentHistory"("squadId", "endedAt");
