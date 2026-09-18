-- CreateTable
CREATE TABLE "Material" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSizeBytes" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "uploadedById" TEXT,
    "uploadedByName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Material_category_idx" ON "Material"("category");

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
