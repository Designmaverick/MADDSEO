-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "ProjectVerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'FAILED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Project" ADD COLUMN "verificationStatus" "ProjectVerificationStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "Project" ADD COLUMN "verifiedAt" TIMESTAMP(3);
ALTER TABLE "Project" ADD COLUMN "verificationError" TEXT;

-- AlterTable
ALTER TABLE "Audit" ADD COLUMN "crawlDepth" INTEGER NOT NULL DEFAULT 2;
ALTER TABLE "Audit" ADD COLUMN "progressCrawl" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Audit" ADD COLUMN "progressPerformance" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Audit" ADD COLUMN "progressAnalysis" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Audit" ADD COLUMN "progressReport" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Audit" ADD COLUMN "lastError" TEXT;

-- AlterTable
ALTER TABLE "Settings" ADD COLUMN "brandPrimaryColor" TEXT;
ALTER TABLE "Settings" ADD COLUMN "brandSecondaryColor" TEXT;
ALTER TABLE "Settings" ADD COLUMN "notificationAuditComplete" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Settings" ADD COLUMN "notificationWeeklyDigest" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Settings" ADD COLUMN "notificationMarketing" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Settings" ADD COLUMN "apiKeyHash" TEXT;
ALTER TABLE "Settings" ADD COLUMN "apiKeyLastFour" TEXT;
ALTER TABLE "Settings" ADD COLUMN "apiKeyCreatedAt" TIMESTAMP(3);
ALTER TABLE "Settings" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
