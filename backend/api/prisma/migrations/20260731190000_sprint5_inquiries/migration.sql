-- CreateEnum
CREATE TYPE "InquiryStatus" AS ENUM ('NEW', 'VIEWED', 'CONTACTED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "InquiryActorType" AS ENUM ('USER', 'VENDOR', 'SYSTEM', 'ADMIN');

-- CreateEnum
CREATE TYPE "InquiryMessageSenderType" AS ENUM ('USER', 'VENDOR', 'SYSTEM');

-- CreateEnum
CREATE TYPE "NotificationRecipientType" AS ENUM ('USER', 'VENDOR');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INQUIRY_CREATED', 'INQUIRY_MESSAGE', 'INQUIRY_STATUS_CHANGED', 'INQUIRY_WITHDRAWN');

-- CreateTable
CREATE TABLE "Inquiry" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "referenceNumber" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "vendorId" UUID NOT NULL,
    "categoryId" UUID,
    "serviceCityId" UUID,
    "subject" TEXT NOT NULL,
    "status" "InquiryStatus" NOT NULL DEFAULT 'NEW',
    "source" TEXT NOT NULL DEFAULT 'PUBLIC_PROFILE',
    "preferredContactMethod" TEXT,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "withdrawnAt" TIMESTAMP(3),
    "userReadAt" TIMESTAMP(3),
    "vendorReadAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InquiryMessage" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "inquiryId" UUID NOT NULL,
    "senderType" "InquiryMessageSenderType" NOT NULL,
    "senderUserId" UUID,
    "senderVendorId" UUID,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InquiryMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InquiryStatusHistory" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "inquiryId" UUID NOT NULL,
    "fromStatus" "InquiryStatus",
    "toStatus" "InquiryStatus" NOT NULL,
    "changedByUserId" UUID,
    "changedByVendorId" UUID,
    "actorType" "InquiryActorType" NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InquiryStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "recipientType" "NotificationRecipientType" NOT NULL,
    "userId" UUID,
    "vendorId" UUID,
    "inquiryId" UUID,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InquiryIdempotencyKey" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "inquiryId" UUID NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InquiryIdempotencyKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Inquiry_referenceNumber_key" ON "Inquiry"("referenceNumber");

-- CreateIndex
CREATE INDEX "Inquiry_userId_lastMessageAt_idx" ON "Inquiry"("userId", "lastMessageAt");

-- CreateIndex
CREATE INDEX "Inquiry_vendorId_lastMessageAt_idx" ON "Inquiry"("vendorId", "lastMessageAt");

-- CreateIndex
CREATE INDEX "Inquiry_status_lastMessageAt_idx" ON "Inquiry"("status", "lastMessageAt");

-- CreateIndex
CREATE INDEX "Inquiry_vendorId_status_lastMessageAt_idx" ON "Inquiry"("vendorId", "status", "lastMessageAt");

-- CreateIndex
CREATE INDEX "InquiryMessage_inquiryId_createdAt_id_idx" ON "InquiryMessage"("inquiryId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "InquiryMessage_senderUserId_idx" ON "InquiryMessage"("senderUserId");

-- CreateIndex
CREATE INDEX "InquiryMessage_senderVendorId_idx" ON "InquiryMessage"("senderVendorId");

-- CreateIndex
CREATE INDEX "InquiryStatusHistory_inquiryId_createdAt_id_idx" ON "InquiryStatusHistory"("inquiryId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_createdAt_idx" ON "Notification"("userId", "readAt", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_vendorId_readAt_createdAt_idx" ON "Notification"("vendorId", "readAt", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_inquiryId_idx" ON "Notification"("inquiryId");

-- CreateIndex
CREATE INDEX "InquiryIdempotencyKey_expiresAt_idx" ON "InquiryIdempotencyKey"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "InquiryIdempotencyKey_userId_key_key" ON "InquiryIdempotencyKey"("userId", "key");

-- AddForeignKey
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "VendorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_serviceCityId_fkey" FOREIGN KEY ("serviceCityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InquiryMessage" ADD CONSTRAINT "InquiryMessage_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InquiryMessage" ADD CONSTRAINT "InquiryMessage_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InquiryMessage" ADD CONSTRAINT "InquiryMessage_senderVendorId_fkey" FOREIGN KEY ("senderVendorId") REFERENCES "VendorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InquiryStatusHistory" ADD CONSTRAINT "InquiryStatusHistory_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InquiryStatusHistory" ADD CONSTRAINT "InquiryStatusHistory_changedByUserId_fkey" FOREIGN KEY ("changedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InquiryStatusHistory" ADD CONSTRAINT "InquiryStatusHistory_changedByVendorId_fkey" FOREIGN KEY ("changedByVendorId") REFERENCES "VendorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "VendorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InquiryIdempotencyKey" ADD CONSTRAINT "InquiryIdempotencyKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InquiryIdempotencyKey" ADD CONSTRAINT "InquiryIdempotencyKey_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
