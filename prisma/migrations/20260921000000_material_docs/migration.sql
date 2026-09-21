-- CreateTable
CREATE TABLE "MaterialDoc" (
    "id" TEXT NOT NULL,
    "parentId" TEXT,
    "title" TEXT NOT NULL,
    "icon" TEXT,
    "contentMd" TEXT NOT NULL DEFAULT '',
    "props" JSONB,
    "position" INTEGER NOT NULL DEFAULT 0,
    "sourceUrl" TEXT,
    "sourceId" TEXT,
    "editedLocally" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedByName" TEXT,

    CONSTRAINT "MaterialDoc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialDocImport" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IDLE',
    "mode" TEXT NOT NULL DEFAULT 'dry-run',
    "pages" INTEGER NOT NULL DEFAULT 0,
    "images" INTEGER NOT NULL DEFAULT 0,
    "reportJson" JSONB,
    "message" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaterialDocImport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MaterialDoc_sourceId_key" ON "MaterialDoc"("sourceId");

-- CreateIndex
CREATE INDEX "MaterialDoc_parentId_position_idx" ON "MaterialDoc"("parentId", "position");

-- AddForeignKey
ALTER TABLE "MaterialDoc" ADD CONSTRAINT "MaterialDoc_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "MaterialDoc"("id") ON DELETE CASCADE ON UPDATE CASCADE;
