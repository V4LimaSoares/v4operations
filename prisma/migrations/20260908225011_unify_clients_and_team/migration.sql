-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "ekyteClientName" TEXT,
ADD COLUMN     "slaGroupName" TEXT;

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "colorVar" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientTeamMember" (
    "clientId" TEXT NOT NULL,
    "teamMemberId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientTeamMember_pkey" PRIMARY KEY ("clientId","teamMemberId")
);

-- CreateIndex
CREATE INDEX "ClientTeamMember_teamMemberId_idx" ON "ClientTeamMember"("teamMemberId");

-- AddForeignKey
ALTER TABLE "ClientTeamMember" ADD CONSTRAINT "ClientTeamMember_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientTeamMember" ADD CONSTRAINT "ClientTeamMember_teamMemberId_fkey" FOREIGN KEY ("teamMemberId") REFERENCES "TeamMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
