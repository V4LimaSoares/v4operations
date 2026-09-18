-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'STAFF';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "modulePermissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "permissionProfileId" TEXT;

-- CreateTable
CREATE TABLE "PermissionProfile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "modules" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PermissionProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PermissionProfile_name_key" ON "PermissionProfile"("name");

-- CreateIndex
CREATE INDEX "User_permissionProfileId_idx" ON "User"("permissionProfileId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_permissionProfileId_fkey" FOREIGN KEY ("permissionProfileId") REFERENCES "PermissionProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
