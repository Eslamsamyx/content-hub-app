-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."ActivityType" ADD VALUE 'USER_UPDATED';
ALTER TYPE "public"."ActivityType" ADD VALUE 'USER_ACTIVATED';
ALTER TYPE "public"."ActivityType" ADD VALUE 'USER_DEACTIVATED';

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "socialLinks" JSONB;
