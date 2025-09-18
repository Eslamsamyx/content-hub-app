-- CreateTable
CREATE TABLE "public"."NotificationPreferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "emailAssetApproved" BOOLEAN NOT NULL DEFAULT true,
    "emailAssetRejected" BOOLEAN NOT NULL DEFAULT true,
    "emailReviewAssigned" BOOLEAN NOT NULL DEFAULT true,
    "emailAssetShared" BOOLEAN NOT NULL DEFAULT true,
    "emailCollectionShared" BOOLEAN NOT NULL DEFAULT true,
    "inAppEnabled" BOOLEAN NOT NULL DEFAULT true,
    "inAppAssetApproved" BOOLEAN NOT NULL DEFAULT true,
    "inAppAssetRejected" BOOLEAN NOT NULL DEFAULT true,
    "inAppReviewAssigned" BOOLEAN NOT NULL DEFAULT true,
    "inAppAssetShared" BOOLEAN NOT NULL DEFAULT true,
    "inAppCollectionShared" BOOLEAN NOT NULL DEFAULT true,
    "inAppSystemUpdates" BOOLEAN NOT NULL DEFAULT true,
    "digestEnabled" BOOLEAN NOT NULL DEFAULT false,
    "digestFrequency" TEXT NOT NULL DEFAULT 'weekly',
    "lastDigestSent" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreferences_userId_key" ON "public"."NotificationPreferences"("userId");

-- AddForeignKey
ALTER TABLE "public"."NotificationPreferences" ADD CONSTRAINT "NotificationPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
