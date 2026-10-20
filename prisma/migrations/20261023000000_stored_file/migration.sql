-- CreateTable
CREATE TABLE "StoredFile" (
    "key" TEXT NOT NULL,
    "mime" TEXT,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoredFile_pkey" PRIMARY KEY ("key")
);
