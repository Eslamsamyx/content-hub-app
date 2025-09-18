-- AlterEnum
ALTER TYPE "public"."ActivityType" ADD VALUE 'CHANGES_REQUESTED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."NotificationType" ADD VALUE 'REVIEW_ASSIGNED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'REVIEW_COMPLETED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'REVIEW_CHANGES_REQUESTED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."ProcessingStatus" ADD VALUE 'REVIEWING';
ALTER TYPE "public"."ProcessingStatus" ADD VALUE 'NEEDS_REVISION';
