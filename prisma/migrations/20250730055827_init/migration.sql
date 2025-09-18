-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('ADMIN', 'CONTENT_MANAGER', 'CREATIVE', 'REVIEWER', 'USER');

-- CreateEnum
CREATE TYPE "public"."CreativeRole" AS ENUM ('DESIGNER_2D', 'DESIGNER_3D', 'VIDEO_EDITOR', 'PHOTOGRAPHER', 'AUDIO_PRODUCER', 'CONTENT_DESIGNER');

-- CreateEnum
CREATE TYPE "public"."AssetType" AS ENUM ('IMAGE', 'VIDEO', 'DOCUMENT', 'AUDIO', 'MODEL_3D', 'DESIGN');

-- CreateEnum
CREATE TYPE "public"."Visibility" AS ENUM ('INTERNAL', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "public"."UsageType" AS ENUM ('INTERNAL', 'PUBLIC');

-- CreateEnum
CREATE TYPE "public"."TagCategory" AS ENUM ('FILE_TYPE', 'ASSET_TYPE', 'STYLE', 'COLOR', 'THEME', 'MOOD', 'RESOLUTION', 'FORMAT', 'ORIENTATION', 'PLATFORM', 'PURPOSE', 'REGION', 'LANGUAGE', 'INDUSTRY', 'CAMPAIGN_TYPE', 'STATUS', 'CUSTOM');

-- CreateEnum
CREATE TYPE "public"."ActivityType" AS ENUM ('ASSET_UPLOADED', 'ASSET_UPDATED', 'ASSET_DOWNLOADED', 'ASSET_VIEWED', 'ASSET_SHARED', 'ASSET_ARCHIVED', 'ASSET_DELETED', 'COLLECTION_CREATED', 'COLLECTION_UPDATED', 'ASSET_ADDED_TO_COLLECTION', 'ASSET_REMOVED_FROM_COLLECTION', 'ASSET_SUBMITTED_FOR_REVIEW', 'ASSET_APPROVED', 'ASSET_REJECTED', 'USER_LOGIN', 'USER_LOGOUT');

-- CreateEnum
CREATE TYPE "public"."ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'NEEDS_REVISION');

-- CreateEnum
CREATE TYPE "public"."UploadStatus" AS ENUM ('PENDING', 'UPLOADING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."ProcessingStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "public"."VariantType" AS ENUM ('THUMBNAIL', 'PREVIEW', 'WEB_OPTIMIZED', 'MOBILE');

-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('ASSET_APPROVED', 'ASSET_REJECTED', 'ASSET_SHARED', 'COLLECTION_SHARED', 'REVIEW_REQUESTED', 'DOWNLOAD_COMPLETED', 'UPLOAD_COMPLETED', 'SYSTEM_UPDATE');

-- CreateTable
CREATE TABLE "public"."Asset" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "filename" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "thumbnailKey" TEXT,
    "previewKey" TEXT,
    "fileSize" BIGINT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "checksum" TEXT,
    "uploadStatus" "public"."UploadStatus" NOT NULL DEFAULT 'PENDING',
    "processingStatus" "public"."ProcessingStatus" NOT NULL DEFAULT 'PENDING',
    "processingError" TEXT,
    "type" "public"."AssetType" NOT NULL,
    "category" TEXT NOT NULL,
    "eventName" TEXT,
    "company" TEXT,
    "project" TEXT,
    "campaign" TEXT,
    "productionYear" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "duration" INTEGER,
    "visibility" "public"."Visibility" NOT NULL DEFAULT 'INTERNAL',
    "usage" "public"."UsageType" NOT NULL DEFAULT 'INTERNAL',
    "readyForPublishing" BOOLEAN NOT NULL DEFAULT false,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "license" TEXT,
    "copyright" TEXT,
    "uploadedById" TEXT NOT NULL,
    "batchId" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AssetMetadata" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "colorSpace" TEXT,
    "dpi" INTEGER,
    "bitDepth" INTEGER,
    "frameRate" DOUBLE PRECISION,
    "bitRate" INTEGER,
    "codec" TEXT,
    "camera" TEXT,
    "lens" TEXT,
    "iso" INTEGER,
    "aperture" DOUBLE PRECISION,
    "shutterSpeed" TEXT,
    "gpsLat" DOUBLE PRECISION,
    "gpsLng" DOUBLE PRECISION,
    "customFields" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetMetadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AssetVariant" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "variantType" "public"."VariantType" NOT NULL,
    "fileKey" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "fileSize" BIGINT NOT NULL,
    "format" TEXT NOT NULL,
    "quality" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "avatar" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "lastLogin" TIMESTAMP(3),
    "role" "public"."UserRole" NOT NULL,
    "creativeRole" "public"."CreativeRole",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" "public"."TagCategory" NOT NULL,
    "color" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AssetTag" (
    "assetId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "addedBy" TEXT NOT NULL,

    CONSTRAINT "AssetTag_pkey" PRIMARY KEY ("assetId","tagId")
);

-- CreateTable
CREATE TABLE "public"."Collection" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "coverImage" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AssetCollection" (
    "collectionId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "addedBy" TEXT NOT NULL,

    CONSTRAINT "AssetCollection_pkey" PRIMARY KEY ("collectionId","assetId")
);

-- CreateTable
CREATE TABLE "public"."ExternalLink" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "password" TEXT,
    "expiresAt" TIMESTAMP(3),
    "maxDownloads" INTEGER,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "allowDownload" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExternalLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ExternalAccessLog" (
    "id" TEXT NOT NULL,
    "linkId" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "action" TEXT NOT NULL,
    "accessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExternalAccessLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Download" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "purpose" TEXT,
    "project" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Download_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AssetAnalytics" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "downloads" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AssetAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Activity" (
    "id" TEXT NOT NULL,
    "type" "public"."ActivityType" NOT NULL,
    "description" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assetId" TEXT,
    "collectionId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Review" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "status" "public"."ReviewStatus" NOT NULL,
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Favorite" (
    "userId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("userId","assetId")
);

-- CreateTable
CREATE TABLE "public"."Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "public"."NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Asset_fileKey_key" ON "public"."Asset"("fileKey");

-- CreateIndex
CREATE INDEX "Asset_fileKey_idx" ON "public"."Asset"("fileKey");

-- CreateIndex
CREATE INDEX "Asset_uploadStatus_idx" ON "public"."Asset"("uploadStatus");

-- CreateIndex
CREATE INDEX "Asset_processingStatus_idx" ON "public"."Asset"("processingStatus");

-- CreateIndex
CREATE INDEX "Asset_type_idx" ON "public"."Asset"("type");

-- CreateIndex
CREATE INDEX "Asset_category_idx" ON "public"."Asset"("category");

-- CreateIndex
CREATE INDEX "Asset_visibility_idx" ON "public"."Asset"("visibility");

-- CreateIndex
CREATE INDEX "Asset_usage_idx" ON "public"."Asset"("usage");

-- CreateIndex
CREATE INDEX "Asset_readyForPublishing_idx" ON "public"."Asset"("readyForPublishing");

-- CreateIndex
CREATE INDEX "Asset_eventName_idx" ON "public"."Asset"("eventName");

-- CreateIndex
CREATE INDEX "Asset_company_idx" ON "public"."Asset"("company");

-- CreateIndex
CREATE INDEX "Asset_project_idx" ON "public"."Asset"("project");

-- CreateIndex
CREATE INDEX "Asset_campaign_idx" ON "public"."Asset"("campaign");

-- CreateIndex
CREATE INDEX "Asset_uploadedById_idx" ON "public"."Asset"("uploadedById");

-- CreateIndex
CREATE INDEX "Asset_batchId_idx" ON "public"."Asset"("batchId");

-- CreateIndex
CREATE INDEX "Asset_createdAt_idx" ON "public"."Asset"("createdAt");

-- CreateIndex
CREATE INDEX "Asset_title_idx" ON "public"."Asset"("title");

-- CreateIndex
CREATE INDEX "Asset_description_idx" ON "public"."Asset"("description");

-- CreateIndex
CREATE UNIQUE INDEX "AssetMetadata_assetId_key" ON "public"."AssetMetadata"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "AssetVariant_fileKey_key" ON "public"."AssetVariant"("fileKey");

-- CreateIndex
CREATE INDEX "AssetVariant_assetId_idx" ON "public"."AssetVariant"("assetId");

-- CreateIndex
CREATE INDEX "AssetVariant_variantType_idx" ON "public"."AssetVariant"("variantType");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "public"."User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "public"."Tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_slug_key" ON "public"."Tag"("slug");

-- CreateIndex
CREATE INDEX "Tag_name_idx" ON "public"."Tag"("name");

-- CreateIndex
CREATE INDEX "Tag_slug_idx" ON "public"."Tag"("slug");

-- CreateIndex
CREATE INDEX "Tag_category_idx" ON "public"."Tag"("category");

-- CreateIndex
CREATE INDEX "AssetTag_assetId_idx" ON "public"."AssetTag"("assetId");

-- CreateIndex
CREATE INDEX "AssetTag_tagId_idx" ON "public"."AssetTag"("tagId");

-- CreateIndex
CREATE INDEX "Collection_createdById_idx" ON "public"."Collection"("createdById");

-- CreateIndex
CREATE INDEX "Collection_isPublic_idx" ON "public"."Collection"("isPublic");

-- CreateIndex
CREATE INDEX "AssetCollection_collectionId_idx" ON "public"."AssetCollection"("collectionId");

-- CreateIndex
CREATE INDEX "AssetCollection_assetId_idx" ON "public"."AssetCollection"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalLink_token_key" ON "public"."ExternalLink"("token");

-- CreateIndex
CREATE INDEX "ExternalLink_token_idx" ON "public"."ExternalLink"("token");

-- CreateIndex
CREATE INDEX "ExternalLink_assetId_idx" ON "public"."ExternalLink"("assetId");

-- CreateIndex
CREATE INDEX "ExternalLink_expiresAt_idx" ON "public"."ExternalLink"("expiresAt");

-- CreateIndex
CREATE INDEX "ExternalAccessLog_linkId_idx" ON "public"."ExternalAccessLog"("linkId");

-- CreateIndex
CREATE INDEX "Download_assetId_idx" ON "public"."Download"("assetId");

-- CreateIndex
CREATE INDEX "Download_userId_idx" ON "public"."Download"("userId");

-- CreateIndex
CREATE INDEX "Download_createdAt_idx" ON "public"."Download"("createdAt");

-- CreateIndex
CREATE INDEX "AssetAnalytics_date_idx" ON "public"."AssetAnalytics"("date");

-- CreateIndex
CREATE INDEX "AssetAnalytics_assetId_idx" ON "public"."AssetAnalytics"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "AssetAnalytics_assetId_date_key" ON "public"."AssetAnalytics"("assetId", "date");

-- CreateIndex
CREATE INDEX "Activity_userId_idx" ON "public"."Activity"("userId");

-- CreateIndex
CREATE INDEX "Activity_type_idx" ON "public"."Activity"("type");

-- CreateIndex
CREATE INDEX "Activity_createdAt_idx" ON "public"."Activity"("createdAt");

-- CreateIndex
CREATE INDEX "Review_assetId_idx" ON "public"."Review"("assetId");

-- CreateIndex
CREATE INDEX "Review_reviewerId_idx" ON "public"."Review"("reviewerId");

-- CreateIndex
CREATE INDEX "Review_status_idx" ON "public"."Review"("status");

-- CreateIndex
CREATE INDEX "Favorite_userId_idx" ON "public"."Favorite"("userId");

-- CreateIndex
CREATE INDEX "Favorite_assetId_idx" ON "public"."Favorite"("assetId");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "public"."Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "public"."Notification"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."Asset" ADD CONSTRAINT "Asset_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AssetMetadata" ADD CONSTRAINT "AssetMetadata_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "public"."Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AssetVariant" ADD CONSTRAINT "AssetVariant_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "public"."Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AssetTag" ADD CONSTRAINT "AssetTag_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "public"."Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AssetTag" ADD CONSTRAINT "AssetTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "public"."Tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Collection" ADD CONSTRAINT "Collection_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AssetCollection" ADD CONSTRAINT "AssetCollection_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "public"."Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AssetCollection" ADD CONSTRAINT "AssetCollection_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "public"."Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ExternalLink" ADD CONSTRAINT "ExternalLink_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "public"."Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ExternalLink" ADD CONSTRAINT "ExternalLink_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ExternalAccessLog" ADD CONSTRAINT "ExternalAccessLog_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "public"."ExternalLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Download" ADD CONSTRAINT "Download_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "public"."Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Download" ADD CONSTRAINT "Download_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AssetAnalytics" ADD CONSTRAINT "AssetAnalytics_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "public"."Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Activity" ADD CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Activity" ADD CONSTRAINT "Activity_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "public"."Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Activity" ADD CONSTRAINT "Activity_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "public"."Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "public"."Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Favorite" ADD CONSTRAINT "Favorite_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "public"."Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
