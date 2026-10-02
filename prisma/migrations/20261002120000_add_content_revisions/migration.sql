-- CreateTable
CREATE TABLE "ContentRevision" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "targetKey" TEXT NOT NULL,
    "collection" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "action" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdByName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentPreviewToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "superAdminId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentPreviewToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContentRevision_kind_targetKey_createdAt_idx" ON "ContentRevision"("kind", "targetKey", "createdAt");

-- CreateIndex
CREATE INDEX "ContentRevision_status_createdAt_idx" ON "ContentRevision"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ContentPreviewToken_tokenHash_key" ON "ContentPreviewToken"("tokenHash");
