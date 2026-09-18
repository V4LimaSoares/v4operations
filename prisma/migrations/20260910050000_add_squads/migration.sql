-- CreateTable
CREATE TABLE "Squad" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Squad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SquadMember" (
    "squadId" TEXT NOT NULL,
    "teamMemberId" TEXT NOT NULL,
    "role" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SquadMember_pkey" PRIMARY KEY ("squadId","teamMemberId")
);

-- CreateTable
CREATE TABLE "SquadClient" (
    "squadId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SquadClient_pkey" PRIMARY KEY ("squadId","clientId")
);

-- CreateIndex
CREATE INDEX "SquadMember_teamMemberId_idx" ON "SquadMember"("teamMemberId");

-- CreateIndex
CREATE INDEX "SquadClient_clientId_idx" ON "SquadClient"("clientId");

-- AddForeignKey
ALTER TABLE "SquadMember" ADD CONSTRAINT "SquadMember_squadId_fkey" FOREIGN KEY ("squadId") REFERENCES "Squad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SquadMember" ADD CONSTRAINT "SquadMember_teamMemberId_fkey" FOREIGN KEY ("teamMemberId") REFERENCES "TeamMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SquadClient" ADD CONSTRAINT "SquadClient_squadId_fkey" FOREIGN KEY ("squadId") REFERENCES "Squad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SquadClient" ADD CONSTRAINT "SquadClient_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
