-- CreateEnum
CREATE TYPE "AdminAuthChallengeType" AS ENUM ('TOTP_VERIFY', 'TOTP_ENROLLMENT');

-- CreateEnum
CREATE TYPE "VendorVerificationDecisionType" AS ENUM ('APPROVED', 'REJECTED', 'SUSPENDED');

-- AlterTable
ALTER TABLE "AdminUser" ADD COLUMN     "failedLoginCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "lockedUntil" TIMESTAMP(3),
ADD COLUMN     "twoFactorConfirmedAt" TIMESTAMP(3),
ADD COLUMN     "twoFactorSecretEncrypted" TEXT,
ADD COLUMN     "twoFactorSecretKeyVersion" INTEGER,
ALTER COLUMN "twoFactorEnabled" SET DEFAULT false;

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "requestId" TEXT,
ADD COLUMN     "userAgent" TEXT;

-- AlterTable
ALTER TABLE "VendorProfile" ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedByAdminUserId" UUID,
ADD COLUMN     "suspendedAt" TIMESTAMP(3),
ADD COLUMN     "suspendedByAdminUserId" UUID,
ADD COLUMN     "suspensionReason" TEXT;

-- CreateTable
CREATE TABLE "AdminAuthChallenge" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "adminUserId" UUID NOT NULL,
    "type" "AdminAuthChallengeType" NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "pendingSecretEncrypted" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuthChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminRecoveryCode" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "adminUserId" UUID NOT NULL,
    "codeHash" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminRecoveryCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorVerificationDecision" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "vendorId" UUID NOT NULL,
    "adminUserId" UUID NOT NULL,
    "decision" "VendorVerificationDecisionType" NOT NULL,
    "reason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorVerificationDecision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminAuthChallenge_tokenHash_key" ON "AdminAuthChallenge"("tokenHash");

-- CreateIndex
CREATE INDEX "AdminAuthChallenge_adminUserId_type_idx" ON "AdminAuthChallenge"("adminUserId", "type");

-- CreateIndex
CREATE INDEX "AdminAuthChallenge_expiresAt_idx" ON "AdminAuthChallenge"("expiresAt");

-- CreateIndex
CREATE INDEX "AdminRecoveryCode_adminUserId_usedAt_idx" ON "AdminRecoveryCode"("adminUserId", "usedAt");

-- CreateIndex
CREATE INDEX "VendorVerificationDecision_vendorId_createdAt_idx" ON "VendorVerificationDecision"("vendorId", "createdAt");

-- CreateIndex
CREATE INDEX "VendorVerificationDecision_adminUserId_createdAt_idx" ON "VendorVerificationDecision"("adminUserId", "createdAt");

-- CreateIndex
CREATE INDEX "VendorVerificationDecision_decision_idx" ON "VendorVerificationDecision"("decision");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "VendorProfile_submittedAt_idx" ON "VendorProfile"("submittedAt");

-- CreateIndex
CREATE INDEX "VendorProfile_reviewedAt_idx" ON "VendorProfile"("reviewedAt");

-- AddForeignKey
ALTER TABLE "AdminAuthChallenge" ADD CONSTRAINT "AdminAuthChallenge_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminRecoveryCode" ADD CONSTRAINT "AdminRecoveryCode_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorProfile" ADD CONSTRAINT "VendorProfile_reviewedByAdminUserId_fkey" FOREIGN KEY ("reviewedByAdminUserId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorProfile" ADD CONSTRAINT "VendorProfile_suspendedByAdminUserId_fkey" FOREIGN KEY ("suspendedByAdminUserId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorVerificationDecision" ADD CONSTRAINT "VendorVerificationDecision_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "VendorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorVerificationDecision" ADD CONSTRAINT "VendorVerificationDecision_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
