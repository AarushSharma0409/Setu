-- Sprint I2: versioned insurance catalogue. All product data stays within the
-- insurance domain and is deliberately separate from marketplace vendors.
CREATE TYPE "InsuranceProductStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'REJECTED', 'WITHDRAWN', 'EXPIRED', 'ARCHIVED');
CREATE TYPE "InsuranceProductVersionStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'RETIRED');
CREATE TYPE "InsuranceCoverageType" AS ENUM ('CORE', 'OPTIONAL', 'CONDITIONAL');
CREATE TYPE "InsuranceEligibilityRuleType" AS ENUM ('MIN_ENTRY_AGE', 'MAX_ENTRY_AGE', 'MIN_POLICY_TERM', 'MAX_POLICY_TERM', 'MIN_SUM_INSURED', 'MAX_SUM_INSURED', 'GEOGRAPHY', 'CUSTOM');
CREATE TYPE "InsuranceEligibilityOperator" AS ENUM ('EQUALS', 'GREATER_THAN_OR_EQUAL', 'LESS_THAN_OR_EQUAL', 'IN', 'NOT_IN');
CREATE TYPE "InsurancePremiumBasisType" AS ENUM ('AGE_BANDED', 'SUM_INSURED_BASED', 'VEHICLE_BASED', 'FIXED', 'TERM_BASED', 'UNDERWRITING_BASED', 'COMBINATION');
CREATE TYPE "InsuranceDurationUnit" AS ENUM ('DAYS', 'MONTHS', 'YEARS');
CREATE TYPE "InsuranceWaitingPeriodType" AS ENUM ('INITIAL', 'SPECIFIC_CONDITION', 'PRE_EXISTING_CONDITION', 'MATERNITY', 'CUSTOM');
CREATE TYPE "InsuranceAddonStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "InsurancePremiumImpactType" AS ENUM ('INCLUDED', 'ADDITIONAL_UNSPECIFIED', 'VARIABLE', 'NOT_APPLICABLE');
CREATE TYPE "InsuranceDeductibleType" AS ENUM ('FIXED', 'PERCENTAGE', 'VOLUNTARY', 'COMPULSORY', 'CO_PAY', 'OTHER');
CREATE TYPE "InsuranceAvailabilityScope" AS ENUM ('PAN_INDIA', 'SELECTED_STATES', 'SELECTED_CITIES', 'MIXED');
CREATE TYPE "InsuranceAvailabilityType" AS ENUM ('AVAILABLE', 'UNAVAILABLE');
CREATE TYPE "InsuranceProductDocumentType" AS ENUM ('PRODUCT_BROCHURE', 'POLICY_WORDING', 'TERMS_AND_CONDITIONS', 'BENEFIT_SCHEDULE', 'PROSPECTUS', 'RATE_REFERENCE', 'REGULATORY_APPROVAL', 'OTHER');
CREATE TYPE "InsuranceProductDocumentStatus" AS ENUM ('UPLOADED', 'APPROVED', 'REJECTED', 'RETIRED');

CREATE TABLE "InsuranceProduct" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "organizationId" UUID NOT NULL, "policyTypeId" UUID NOT NULL,
  "code" TEXT NOT NULL, "slug" TEXT NOT NULL, "currentVersionId" UUID, "status" "InsuranceProductStatus" NOT NULL DEFAULT 'DRAFT',
  "withdrawnAt" TIMESTAMP(3), "withdrawalReason" TEXT, "createdByAdminUserId" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InsuranceProduct_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "InsuranceProductVersion" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "productId" UUID NOT NULL, "versionNumber" INTEGER NOT NULL,
  "status" "InsuranceProductVersionStatus" NOT NULL DEFAULT 'DRAFT', "name" TEXT NOT NULL, "shortDescription" TEXT NOT NULL,
  "longDescription" TEXT, "coverageSummary" TEXT, "availabilityScope" "InsuranceAvailabilityScope" NOT NULL DEFAULT 'PAN_INDIA',
  "effectiveFrom" TIMESTAMP(3), "effectiveUntil" TIMESTAMP(3), "createdByAdminUserId" UUID NOT NULL, "submittedAt" TIMESTAMP(3),
  "approvedAt" TIMESTAMP(3), "approvedByAdminUserId" UUID, "rejectedAt" TIMESTAMP(3), "rejectionReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InsuranceProductVersion_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "InsuranceProductCoverage" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "productVersionId" UUID NOT NULL, "code" TEXT NOT NULL, "name" TEXT NOT NULL,
  "description" TEXT NOT NULL, "coverageType" "InsuranceCoverageType" NOT NULL, "limitDescription" TEXT, "isCore" BOOLEAN NOT NULL DEFAULT false,
  "sortOrder" INTEGER NOT NULL DEFAULT 0, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InsuranceProductCoverage_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "InsuranceProductEligibilityRule" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "productVersionId" UUID NOT NULL, "ruleType" "InsuranceEligibilityRuleType" NOT NULL,
  "operator" "InsuranceEligibilityOperator" NOT NULL, "value" TEXT NOT NULL, "unit" TEXT, "description" TEXT NOT NULL,
  "isHardRule" BOOLEAN NOT NULL DEFAULT true, "sortOrder" INTEGER NOT NULL DEFAULT 0, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InsuranceProductEligibilityRule_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "InsuranceProductSumInsuredOption" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "productVersionId" UUID NOT NULL, "amount" DECIMAL(14,2) NOT NULL, "currency" CHAR(3) NOT NULL DEFAULT 'INR',
  "label" TEXT, "isDefault" BOOLEAN NOT NULL DEFAULT false, "sortOrder" INTEGER NOT NULL DEFAULT 0, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InsuranceProductSumInsuredOption_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "InsuranceProductPremiumBasis" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "productVersionId" UUID NOT NULL, "basisType" "InsurancePremiumBasisType" NOT NULL,
  "description" TEXT NOT NULL, "metadata" JSONB NOT NULL DEFAULT '{}', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InsuranceProductPremiumBasis_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "InsuranceProductWaitingPeriod" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "productVersionId" UUID NOT NULL, "code" TEXT NOT NULL, "name" TEXT NOT NULL, "description" TEXT NOT NULL,
  "type" "InsuranceWaitingPeriodType" NOT NULL, "durationValue" INTEGER NOT NULL, "durationUnit" "InsuranceDurationUnit" NOT NULL, "appliesTo" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InsuranceProductWaitingPeriod_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "InsuranceProductExclusion" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "productVersionId" UUID NOT NULL, "code" TEXT NOT NULL, "title" TEXT NOT NULL, "description" TEXT NOT NULL,
  "category" TEXT, "sortOrder" INTEGER NOT NULL DEFAULT 0, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InsuranceProductExclusion_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "InsuranceProductAddon" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "productVersionId" UUID NOT NULL, "code" TEXT NOT NULL, "name" TEXT NOT NULL, "description" TEXT NOT NULL,
  "status" "InsuranceAddonStatus" NOT NULL DEFAULT 'ACTIVE', "premiumImpactType" "InsurancePremiumImpactType" NOT NULL, "premiumImpactDescription" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InsuranceProductAddon_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "InsuranceProductDeductible" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "productVersionId" UUID NOT NULL, "type" "InsuranceDeductibleType" NOT NULL, "amount" DECIMAL(14,2),
  "percentage" DECIMAL(5,2), "currency" CHAR(3), "description" TEXT NOT NULL, "isOptional" BOOLEAN NOT NULL DEFAULT false,
  "sortOrder" INTEGER NOT NULL DEFAULT 0, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InsuranceProductDeductible_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "InsuranceProductAvailability" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "productVersionId" UUID NOT NULL, "stateId" UUID, "cityId" UUID,
  "availabilityType" "InsuranceAvailabilityType" NOT NULL DEFAULT 'AVAILABLE', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InsuranceProductAvailability_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "InsuranceProductDocument" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "productId" UUID NOT NULL, "productVersionId" UUID NOT NULL, "type" "InsuranceProductDocumentType" NOT NULL,
  "title" TEXT NOT NULL, "storageKey" TEXT NOT NULL, "originalFileName" TEXT NOT NULL, "mimeType" TEXT NOT NULL, "sizeBytes" INTEGER NOT NULL,
  "checksumSha256" TEXT NOT NULL, "status" "InsuranceProductDocumentStatus" NOT NULL DEFAULT 'UPLOADED', "effectiveFrom" TIMESTAMP(3), "effectiveUntil" TIMESTAMP(3),
  "uploadedByUserId" UUID, "uploadedByAdminUserId" UUID, "approvedByAdminUserId" UUID, "approvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InsuranceProductDocument_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InsuranceProduct_slug_key" ON "InsuranceProduct"("slug");
CREATE UNIQUE INDEX "InsuranceProduct_currentVersionId_key" ON "InsuranceProduct"("currentVersionId");
CREATE UNIQUE INDEX "InsuranceProduct_organizationId_code_key" ON "InsuranceProduct"("organizationId", "code");
CREATE INDEX "InsuranceProduct_organizationId_status_updatedAt_idx" ON "InsuranceProduct"("organizationId", "status", "updatedAt");
CREATE INDEX "InsuranceProduct_policyTypeId_status_idx" ON "InsuranceProduct"("policyTypeId", "status");
CREATE UNIQUE INDEX "InsuranceProductVersion_productId_versionNumber_key" ON "InsuranceProductVersion"("productId", "versionNumber");
CREATE INDEX "InsuranceProductVersion_productId_status_effectiveFrom_effectiveUntil_idx" ON "InsuranceProductVersion"("productId", "status", "effectiveFrom", "effectiveUntil");
CREATE UNIQUE INDEX "InsuranceProductCoverage_productVersionId_code_key" ON "InsuranceProductCoverage"("productVersionId", "code");
CREATE UNIQUE INDEX "InsuranceProductSumInsuredOption_productVersionId_amount_key" ON "InsuranceProductSumInsuredOption"("productVersionId", "amount");
CREATE UNIQUE INDEX "InsuranceProductPremiumBasis_productVersionId_key" ON "InsuranceProductPremiumBasis"("productVersionId");
CREATE UNIQUE INDEX "InsuranceProductWaitingPeriod_productVersionId_code_key" ON "InsuranceProductWaitingPeriod"("productVersionId", "code");
CREATE UNIQUE INDEX "InsuranceProductExclusion_productVersionId_code_key" ON "InsuranceProductExclusion"("productVersionId", "code");
CREATE UNIQUE INDEX "InsuranceProductAddon_productVersionId_code_key" ON "InsuranceProductAddon"("productVersionId", "code");
CREATE INDEX "InsuranceProductAvailability_productVersionId_idx" ON "InsuranceProductAvailability"("productVersionId");
CREATE INDEX "InsuranceProductDocument_productId_productVersionId_status_idx" ON "InsuranceProductDocument"("productId", "productVersionId", "status");

ALTER TABLE "InsuranceProduct" ADD CONSTRAINT "InsuranceProduct_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "InsuranceOrganization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InsuranceProduct" ADD CONSTRAINT "InsuranceProduct_policyTypeId_fkey" FOREIGN KEY ("policyTypeId") REFERENCES "InsurancePolicyType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InsuranceProduct" ADD CONSTRAINT "InsuranceProduct_createdByAdminUserId_fkey" FOREIGN KEY ("createdByAdminUserId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InsuranceProductVersion" ADD CONSTRAINT "InsuranceProductVersion_productId_fkey" FOREIGN KEY ("productId") REFERENCES "InsuranceProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InsuranceProductVersion" ADD CONSTRAINT "InsuranceProductVersion_createdByAdminUserId_fkey" FOREIGN KEY ("createdByAdminUserId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InsuranceProductVersion" ADD CONSTRAINT "InsuranceProductVersion_approvedByAdminUserId_fkey" FOREIGN KEY ("approvedByAdminUserId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InsuranceProduct" ADD CONSTRAINT "InsuranceProduct_currentVersionId_fkey" FOREIGN KEY ("currentVersionId") REFERENCES "InsuranceProductVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InsuranceProductCoverage" ADD CONSTRAINT "InsuranceProductCoverage_productVersionId_fkey" FOREIGN KEY ("productVersionId") REFERENCES "InsuranceProductVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InsuranceProductEligibilityRule" ADD CONSTRAINT "InsuranceProductEligibilityRule_productVersionId_fkey" FOREIGN KEY ("productVersionId") REFERENCES "InsuranceProductVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InsuranceProductSumInsuredOption" ADD CONSTRAINT "InsuranceProductSumInsuredOption_productVersionId_fkey" FOREIGN KEY ("productVersionId") REFERENCES "InsuranceProductVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InsuranceProductPremiumBasis" ADD CONSTRAINT "InsuranceProductPremiumBasis_productVersionId_fkey" FOREIGN KEY ("productVersionId") REFERENCES "InsuranceProductVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InsuranceProductWaitingPeriod" ADD CONSTRAINT "InsuranceProductWaitingPeriod_productVersionId_fkey" FOREIGN KEY ("productVersionId") REFERENCES "InsuranceProductVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InsuranceProductExclusion" ADD CONSTRAINT "InsuranceProductExclusion_productVersionId_fkey" FOREIGN KEY ("productVersionId") REFERENCES "InsuranceProductVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InsuranceProductAddon" ADD CONSTRAINT "InsuranceProductAddon_productVersionId_fkey" FOREIGN KEY ("productVersionId") REFERENCES "InsuranceProductVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InsuranceProductDeductible" ADD CONSTRAINT "InsuranceProductDeductible_productVersionId_fkey" FOREIGN KEY ("productVersionId") REFERENCES "InsuranceProductVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InsuranceProductAvailability" ADD CONSTRAINT "InsuranceProductAvailability_productVersionId_fkey" FOREIGN KEY ("productVersionId") REFERENCES "InsuranceProductVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InsuranceProductAvailability" ADD CONSTRAINT "InsuranceProductAvailability_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "State"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InsuranceProductAvailability" ADD CONSTRAINT "InsuranceProductAvailability_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InsuranceProductDocument" ADD CONSTRAINT "InsuranceProductDocument_productId_fkey" FOREIGN KEY ("productId") REFERENCES "InsuranceProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InsuranceProductDocument" ADD CONSTRAINT "InsuranceProductDocument_productVersionId_fkey" FOREIGN KEY ("productVersionId") REFERENCES "InsuranceProductVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InsuranceProductDocument" ADD CONSTRAINT "InsuranceProductDocument_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InsuranceProductDocument" ADD CONSTRAINT "InsuranceProductDocument_uploadedByAdminUserId_fkey" FOREIGN KEY ("uploadedByAdminUserId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InsuranceProductDocument" ADD CONSTRAINT "InsuranceProductDocument_approvedByAdminUserId_fkey" FOREIGN KEY ("approvedByAdminUserId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
