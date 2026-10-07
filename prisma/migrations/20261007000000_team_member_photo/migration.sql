-- CreateTable
CREATE TABLE "TeamMemberPhoto" (
    "teamMemberId" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "mime" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamMemberPhoto_pkey" PRIMARY KEY ("teamMemberId")
);

-- AddForeignKey
ALTER TABLE "TeamMemberPhoto" ADD CONSTRAINT "TeamMemberPhoto_teamMemberId_fkey" FOREIGN KEY ("teamMemberId") REFERENCES "TeamMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
