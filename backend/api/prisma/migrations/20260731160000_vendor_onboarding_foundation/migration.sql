CREATE TYPE "VendorStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'SUSPENDED');
CREATE TYPE "VendorDocumentType" AS ENUM ('GST_CERTIFICATE', 'PAN_CARD', 'BUSINESS_REGISTRATION', 'ADDRESS_PROOF', 'OTHER');
CREATE TYPE "VendorDocumentStatus" AS ENUM ('UPLOADED', 'PENDING_REVIEW', 'APPROVED', 'REJECTED');

CREATE TABLE "Category" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "State" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "State_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "City" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "stateId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VendorProfile" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "ownerUserId" UUID NOT NULL,
  "businessName" TEXT,
  "slug" TEXT,
  "legalName" TEXT,
  "description" TEXT,
  "contactEmail" TEXT,
  "contactPhone" TEXT,
  "websiteUrl" TEXT,
  "yearEstablished" INTEGER,
  "addressLine1" TEXT,
  "addressLine2" TEXT,
  "postalCode" TEXT,
  "primaryCityId" UUID,
  "status" "VendorStatus" NOT NULL DEFAULT 'DRAFT',
  "submittedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VendorProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VendorCategory" (
  "vendorId" UUID NOT NULL,
  "categoryId" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VendorCategory_pkey" PRIMARY KEY ("vendorId", "categoryId")
);

CREATE TABLE "VendorServiceArea" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "vendorId" UUID NOT NULL,
  "cityId" UUID NOT NULL,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VendorServiceArea_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VendorDocument" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "vendorId" UUID NOT NULL,
  "type" "VendorDocumentType" NOT NULL,
  "storageKey" TEXT NOT NULL,
  "originalFileName" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "checksumSha256" TEXT NOT NULL,
  "status" "VendorDocumentStatus" NOT NULL DEFAULT 'UPLOADED',
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VendorDocument_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");
CREATE INDEX "Category_isActive_sortOrder_idx" ON "Category"("isActive", "sortOrder");
CREATE INDEX "Category_name_idx" ON "Category"("name");
CREATE UNIQUE INDEX "State_code_key" ON "State"("code");
CREATE INDEX "State_isActive_name_idx" ON "State"("isActive", "name");
CREATE UNIQUE INDEX "City_stateId_slug_key" ON "City"("stateId", "slug");
CREATE INDEX "City_stateId_idx" ON "City"("stateId");
CREATE INDEX "City_isActive_name_idx" ON "City"("isActive", "name");
CREATE UNIQUE INDEX "VendorProfile_ownerUserId_key" ON "VendorProfile"("ownerUserId");
CREATE UNIQUE INDEX "VendorProfile_slug_key" ON "VendorProfile"("slug");
CREATE INDEX "VendorProfile_ownerUserId_idx" ON "VendorProfile"("ownerUserId");
CREATE INDEX "VendorProfile_status_idx" ON "VendorProfile"("status");
CREATE INDEX "VendorProfile_primaryCityId_idx" ON "VendorProfile"("primaryCityId");
CREATE INDEX "VendorCategory_categoryId_idx" ON "VendorCategory"("categoryId");
CREATE UNIQUE INDEX "VendorServiceArea_vendorId_cityId_key" ON "VendorServiceArea"("vendorId", "cityId");
CREATE INDEX "VendorServiceArea_cityId_idx" ON "VendorServiceArea"("cityId");
CREATE INDEX "VendorServiceArea_vendorId_idx" ON "VendorServiceArea"("vendorId");
CREATE UNIQUE INDEX "VendorDocument_storageKey_key" ON "VendorDocument"("storageKey");
CREATE INDEX "VendorDocument_vendorId_idx" ON "VendorDocument"("vendorId");
CREATE INDEX "VendorDocument_type_idx" ON "VendorDocument"("type");
CREATE INDEX "VendorDocument_status_idx" ON "VendorDocument"("status");
CREATE INDEX "VendorDocument_uploadedAt_idx" ON "VendorDocument"("uploadedAt");

ALTER TABLE "City" ADD CONSTRAINT "City_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "State"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VendorProfile" ADD CONSTRAINT "VendorProfile_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VendorProfile" ADD CONSTRAINT "VendorProfile_primaryCityId_fkey" FOREIGN KEY ("primaryCityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VendorCategory" ADD CONSTRAINT "VendorCategory_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "VendorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VendorCategory" ADD CONSTRAINT "VendorCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VendorServiceArea" ADD CONSTRAINT "VendorServiceArea_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "VendorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VendorServiceArea" ADD CONSTRAINT "VendorServiceArea_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VendorDocument" ADD CONSTRAINT "VendorDocument_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "VendorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
