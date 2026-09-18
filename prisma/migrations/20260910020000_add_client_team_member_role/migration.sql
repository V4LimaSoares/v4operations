-- AlterTable
ALTER TABLE "ClientTeamMember" ADD COLUMN     "isPrimary" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "role" TEXT;
