-- CreateTable
CREATE TABLE "public"."SearchHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "filters" JSONB,
    "resultCount" INTEGER NOT NULL DEFAULT 0,
    "clickedAssets" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SearchHistory_userId_idx" ON "public"."SearchHistory"("userId");

-- CreateIndex
CREATE INDEX "SearchHistory_query_idx" ON "public"."SearchHistory"("query");

-- CreateIndex
CREATE INDEX "SearchHistory_createdAt_idx" ON "public"."SearchHistory"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."SearchHistory" ADD CONSTRAINT "SearchHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
