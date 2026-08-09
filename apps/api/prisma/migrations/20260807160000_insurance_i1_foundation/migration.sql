-- Insurance Sprint I1: deliberately isolated from marketplace vendor tables.
CREATE TYPE "InsuranceOperatingRole" AS ENUM ('BROKER', 'WEB_AGGREGATOR', 'CORPORATE_AGENT', 'INSURANCE_MARKETING_FIRM', 'DIRECT_INSURER_PLATFORM', 'TECHNOLOGY_SERVICE_PROVIDER', 'OTHER_LICENSED_MODEL');
CREATE TYPE "InsuranceOperatingModelStatus" AS ENUM ('DRAFT', 'ACTIVE', 'EXPIRED', 'SUSPENDED', 'REVOKED', 'ARCHIVED');
CREATE TYPE "InsuranceCapability" AS ENUM ('DISPLAY_INSURANCE_PRODUCTS', 'COLLECT_CUSTOMER_NEEDS', 'REQUEST_QUOTES', 'COMPARE_QUOTES', 'RANK_QUOTES', 'RECOMMEND_PRODUCTS', 'REDIRECT_TO_PURCHASE', 'COLLECT_PAYMENT', 'ISSUE_POLICY', 'GENERATE_POLICY_DOCUMENTS', 'SERVICE_POLICY', 'HANDLE_CLAIMS');
CREATE TYPE "InsuranceOrganizationType" AS ENUM ('INSURER', 'INTERMEDIARY', 'BROKER', 'CORPORATE_AGENT', 'INSURANCE_MARKETING_FIRM', 'OTHER_LICENSED_ORGANIZATION');
CREATE TYPE "InsuranceOrganizationStatus" AS ENUM ('DRAFT', 'PENDING_VERIFICATION', 'ACTIVE', 'REJECTED', 'SUSPENDED', 'EXPIRED');
CREATE TYPE "InsuranceLicenceStatus" AS ENUM ('DRAFT', 'VALID', 'EXPIRED', 'SUSPENDED', 'REVOKED');
CREATE TYPE "InsuranceDocumentType" AS ENUM ('REGULATORY_LICENCE', 'CERTIFICATE_OF_REGISTRATION', 'AUTHORIZATION_LETTER', 'BOARD_AUTHORIZATION', 'TAX_REGISTRATION', 'BUSINESS_REGISTRATION', 'DATA_PROCESSING_AGREEMENT', 'COMMERCIAL_AGREEMENT', 'PRODUCT_AUTHORIZATION', 'OTHER');
CREATE TYPE "InsuranceDocumentStatus" AS ENUM ('UPLOADED', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED');
CREATE TYPE "InsuranceOrganizationUserRole" AS ENUM ('ORGANIZATION_ADMIN', 'PRODUCT_MANAGER', 'COMPLIANCE_MANAGER', 'INTEGRATION_MANAGER', 'OPERATIONS_USER', 'READ_ONLY');
CREATE TYPE "InsuranceOrganizationUserStatus" AS ENUM ('INVITED', 'ACTIVE', 'SUSPENDED', 'REVOKED');
CREATE TYPE "InsuranceLineStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED');
CREATE TYPE "InsurancePolicyTypeStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED');
CREATE TYPE "InsuranceTemplateStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'RETIRED');
CREATE TYPE "InsuranceDisclosureAudience" AS ENUM ('CUSTOMER', 'ORGANIZATION_USER', 'ADMIN', 'PUBLIC');
CREATE TYPE "InsuranceDisclosurePurpose" AS ENUM ('OPERATING_ROLE', 'QUOTE_COMPARISON', 'RANKING_METHODOLOGY', 'COMMERCIAL_RELATIONSHIP', 'DATA_USE', 'REDIRECT', 'NO_POLICY_ISSUANCE', 'GENERAL_INSURANCE_NOTICE');
CREATE TYPE "InsuranceConsentPurpose" AS ENUM ('QUOTE_REQUEST', 'INSURER_DATA_SHARING', 'SENSITIVE_DATA_PROCESSING', 'MARKETING', 'PROFILE_SAVING', 'REDIRECT_HANDOFF');

CREATE TABLE "InsuranceOperatingModel" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "legalEntityName" TEXT NOT NULL, "tradeName" TEXT,
  "operatingRole" "InsuranceOperatingRole" NOT NULL, "licenceNumber" TEXT NOT NULL, "licenceAuthority" TEXT NOT NULL,
  "licenceIssuedAt" TIMESTAMP(3), "licenceValidFrom" TIMESTAMP(3) NOT NULL, "licenceValidUntil" TIMESTAMP(3),
  "status" "InsuranceOperatingModelStatus" NOT NULL DEFAULT 'DRAFT', "countryCode" CHAR(2) NOT NULL DEFAULT 'IN',
  "primaryJurisdiction" TEXT NOT NULL, "permittedInsuranceLines" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "permittedOrganizationTypes" "InsuranceOrganizationType"[] NOT NULL DEFAULT ARRAY[]::"InsuranceOrganizationType"[],
  "permittedCapabilities" "InsuranceCapability"[] NOT NULL DEFAULT ARRAY[]::"InsuranceCapability"[],
  "restrictedCapabilities" "InsuranceCapability"[] NOT NULL DEFAULT ARRAY[]::"InsuranceCapability"[],
  "configurationVersion" INTEGER NOT NULL, "effectiveFrom" TIMESTAMP(3), "effectiveUntil" TIMESTAMP(3),
  "createdByAdminUserId" UUID NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "InsuranceOperatingModel_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "InsuranceLine" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "code" TEXT NOT NULL, "name" TEXT NOT NULL, "description" TEXT,
  "status" "InsuranceLineStatus" NOT NULL DEFAULT 'DRAFT', "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InsuranceLine_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "InsuranceOrganization" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "type" "InsuranceOrganizationType" NOT NULL, "legalName" TEXT NOT NULL,
  "tradeName" TEXT, "slug" TEXT NOT NULL, "registrationNumber" TEXT NOT NULL, "regulatoryAuthority" TEXT NOT NULL,
  "registrationValidFrom" TIMESTAMP(3), "registrationValidUntil" TIMESTAMP(3),
  "status" "InsuranceOrganizationStatus" NOT NULL DEFAULT 'DRAFT', "websiteUrl" TEXT, "supportEmail" TEXT,
  "supportPhone" TEXT, "grievanceEmail" TEXT, "grievancePhone" TEXT, "registeredAddress" TEXT,
  "countryCode" CHAR(2) NOT NULL DEFAULT 'IN', "primaryJurisdiction" TEXT NOT NULL, "submittedAt" TIMESTAMP(3),
  "reviewedAt" TIMESTAMP(3), "reviewedByAdminUserId" UUID, "rejectionReason" TEXT, "suspensionReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InsuranceOrganization_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "InsuranceOrganizationLine" (
  "organizationId" UUID NOT NULL, "insuranceLineId" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "InsuranceOrganizationLine_pkey" PRIMARY KEY ("organizationId", "insuranceLineId")
);
CREATE TABLE "InsuranceOrganizationLicence" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "organizationId" UUID NOT NULL, "type" TEXT NOT NULL,
  "licenceNumber" TEXT NOT NULL, "authority" TEXT NOT NULL, "validFrom" TIMESTAMP(3) NOT NULL,
  "validUntil" TIMESTAMP(3), "status" "InsuranceLicenceStatus" NOT NULL DEFAULT 'DRAFT',
  "permittedLineCodes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[], "scope" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InsuranceOrganizationLicence_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "InsuranceOrganizationDocument" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "organizationId" UUID NOT NULL, "licenceId" UUID,
  "type" "InsuranceDocumentType" NOT NULL, "storageKey" TEXT NOT NULL, "originalFileName" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL, "sizeBytes" INTEGER NOT NULL, "checksumSha256" TEXT NOT NULL,
  "status" "InsuranceDocumentStatus" NOT NULL DEFAULT 'UPLOADED', "metadata" JSONB NOT NULL DEFAULT '{}',
  "uploadedByAdminUserId" UUID, "uploadedByOrganizationUserId" UUID, "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedAt" TIMESTAMP(3), "reviewedByAdminUserId" UUID, "rejectionReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InsuranceOrganizationDocument_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "InsuranceOrganizationUser" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "organizationId" UUID NOT NULL, "userId" UUID NOT NULL,
  "role" "InsuranceOrganizationUserRole" NOT NULL, "status" "InsuranceOrganizationUserStatus" NOT NULL DEFAULT 'INVITED',
  "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "acceptedAt" TIMESTAMP(3), "lastAccessAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InsuranceOrganizationUser_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "InsurancePolicyType" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "insuranceLineId" UUID NOT NULL, "code" TEXT NOT NULL,
  "name" TEXT NOT NULL, "slug" TEXT NOT NULL, "description" TEXT,
  "status" "InsurancePolicyTypeStatus" NOT NULL DEFAULT 'DRAFT', "isEnabledForMvp" BOOLEAN NOT NULL DEFAULT false,
  "sortOrder" INTEGER NOT NULL DEFAULT 0, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "InsurancePolicyType_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "InsuranceDisclosureTemplate" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "code" TEXT NOT NULL, "name" TEXT NOT NULL,
  "audience" "InsuranceDisclosureAudience" NOT NULL, "purpose" "InsuranceDisclosurePurpose" NOT NULL,
  "content" TEXT NOT NULL, "contentFormat" TEXT NOT NULL DEFAULT 'plain_text', "version" INTEGER NOT NULL,
  "status" "InsuranceTemplateStatus" NOT NULL DEFAULT 'DRAFT', "effectiveFrom" TIMESTAMP(3), "effectiveUntil" TIMESTAMP(3),
  "requiresAcknowledgement" BOOLEAN NOT NULL DEFAULT false, "createdByAdminUserId" UUID NOT NULL,
  "publishedByAdminUserId" UUID, "publishedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "InsuranceDisclosureTemplate_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "InsuranceConsentTemplate" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "code" TEXT NOT NULL, "name" TEXT NOT NULL,
  "purpose" "InsuranceConsentPurpose" NOT NULL, "description" TEXT, "dataCategories" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "processingPurposes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[], "thirdPartyCategories" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "retentionReference" TEXT, "withdrawalDescription" TEXT, "content" TEXT NOT NULL, "version" INTEGER NOT NULL,
  "status" "InsuranceTemplateStatus" NOT NULL DEFAULT 'DRAFT', "effectiveFrom" TIMESTAMP(3), "effectiveUntil" TIMESTAMP(3),
  "createdByAdminUserId" UUID NOT NULL, "publishedByAdminUserId" UUID, "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InsuranceConsentTemplate_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "InsuranceConfigurationHistory" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "adminUserId" UUID NOT NULL, "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL, "entityId" TEXT, "metadata" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "InsuranceConfigurationHistory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InsuranceOperatingModel_legalEntityName_primaryJurisdiction_configurationVersion_key" ON "InsuranceOperatingModel"("legalEntityName", "primaryJurisdiction", "configurationVersion");
CREATE INDEX "InsuranceOperatingModel_status_effectiveFrom_effectiveUntil_idx" ON "InsuranceOperatingModel"("status", "effectiveFrom", "effectiveUntil");
CREATE INDEX "InsuranceOperatingModel_legalEntityName_primaryJurisdiction_idx" ON "InsuranceOperatingModel"("legalEntityName", "primaryJurisdiction");
CREATE UNIQUE INDEX "InsuranceLine_code_key" ON "InsuranceLine"("code");
CREATE INDEX "InsuranceLine_status_sortOrder_idx" ON "InsuranceLine"("status", "sortOrder");
CREATE UNIQUE INDEX "InsuranceOrganization_slug_key" ON "InsuranceOrganization"("slug");
CREATE UNIQUE INDEX "InsuranceOrganization_registrationNumber_regulatoryAuthority_key" ON "InsuranceOrganization"("registrationNumber", "regulatoryAuthority");
CREATE INDEX "InsuranceOrganization_type_status_updatedAt_idx" ON "InsuranceOrganization"("type", "status", "updatedAt");
CREATE INDEX "InsuranceOrganization_registrationValidUntil_idx" ON "InsuranceOrganization"("registrationValidUntil");
CREATE INDEX "InsuranceOrganizationLine_insuranceLineId_idx" ON "InsuranceOrganizationLine"("insuranceLineId");
CREATE UNIQUE INDEX "InsuranceOrganizationLicence_organizationId_licenceNumber_key" ON "InsuranceOrganizationLicence"("organizationId", "licenceNumber");
CREATE INDEX "InsuranceOrganizationLicence_organizationId_validUntil_idx" ON "InsuranceOrganizationLicence"("organizationId", "validUntil");
CREATE INDEX "InsuranceOrganizationLicence_licenceNumber_idx" ON "InsuranceOrganizationLicence"("licenceNumber");
CREATE INDEX "InsuranceOrganizationLicence_status_validUntil_idx" ON "InsuranceOrganizationLicence"("status", "validUntil");
CREATE UNIQUE INDEX "InsuranceOrganizationDocument_storageKey_key" ON "InsuranceOrganizationDocument"("storageKey");
CREATE INDEX "InsuranceOrganizationDocument_organizationId_status_idx" ON "InsuranceOrganizationDocument"("organizationId", "status");
CREATE INDEX "InsuranceOrganizationDocument_licenceId_idx" ON "InsuranceOrganizationDocument"("licenceId");
CREATE UNIQUE INDEX "InsuranceOrganizationUser_organizationId_userId_key" ON "InsuranceOrganizationUser"("organizationId", "userId");
CREATE INDEX "InsuranceOrganizationUser_userId_status_idx" ON "InsuranceOrganizationUser"("userId", "status");
CREATE INDEX "InsuranceOrganizationUser_organizationId_status_idx" ON "InsuranceOrganizationUser"("organizationId", "status");
CREATE UNIQUE INDEX "InsurancePolicyType_slug_key" ON "InsurancePolicyType"("slug");
CREATE UNIQUE INDEX "InsurancePolicyType_insuranceLineId_code_key" ON "InsurancePolicyType"("insuranceLineId", "code");
CREATE INDEX "InsurancePolicyType_status_sortOrder_idx" ON "InsurancePolicyType"("status", "sortOrder");
CREATE INDEX "InsurancePolicyType_insuranceLineId_idx" ON "InsurancePolicyType"("insuranceLineId");
CREATE UNIQUE INDEX "InsuranceDisclosureTemplate_code_audience_version_key" ON "InsuranceDisclosureTemplate"("code", "audience", "version");
CREATE INDEX "InsuranceDisclosureTemplate_code_audience_status_effectiveFrom_idx" ON "InsuranceDisclosureTemplate"("code", "audience", "status", "effectiveFrom");
CREATE UNIQUE INDEX "InsuranceConsentTemplate_code_version_key" ON "InsuranceConsentTemplate"("code", "version");
CREATE INDEX "InsuranceConsentTemplate_code_status_effectiveFrom_idx" ON "InsuranceConsentTemplate"("code", "status", "effectiveFrom");
CREATE INDEX "InsuranceConfigurationHistory_entityType_entityId_createdAt_idx" ON "InsuranceConfigurationHistory"("entityType", "entityId", "createdAt");
CREATE INDEX "InsuranceConfigurationHistory_action_createdAt_idx" ON "InsuranceConfigurationHistory"("action", "createdAt");

ALTER TABLE "InsuranceOperatingModel" ADD CONSTRAINT "InsuranceOperatingModel_createdByAdminUserId_fkey" FOREIGN KEY ("createdByAdminUserId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InsuranceOrganizationLine" ADD CONSTRAINT "InsuranceOrganizationLine_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "InsuranceOrganization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InsuranceOrganizationLine" ADD CONSTRAINT "InsuranceOrganizationLine_insuranceLineId_fkey" FOREIGN KEY ("insuranceLineId") REFERENCES "InsuranceLine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InsuranceOrganizationLicence" ADD CONSTRAINT "InsuranceOrganizationLicence_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "InsuranceOrganization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InsuranceOrganizationDocument" ADD CONSTRAINT "InsuranceOrganizationDocument_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "InsuranceOrganization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InsuranceOrganizationDocument" ADD CONSTRAINT "InsuranceOrganizationDocument_licenceId_fkey" FOREIGN KEY ("licenceId") REFERENCES "InsuranceOrganizationLicence"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InsuranceOrganizationDocument" ADD CONSTRAINT "InsuranceOrganizationDocument_uploadedByAdminUserId_fkey" FOREIGN KEY ("uploadedByAdminUserId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InsuranceOrganizationDocument" ADD CONSTRAINT "InsuranceOrganizationDocument_uploadedByOrganizationUserId_fkey" FOREIGN KEY ("uploadedByOrganizationUserId") REFERENCES "InsuranceOrganizationUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InsuranceOrganizationDocument" ADD CONSTRAINT "InsuranceOrganizationDocument_reviewedByAdminUserId_fkey" FOREIGN KEY ("reviewedByAdminUserId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InsuranceOrganizationUser" ADD CONSTRAINT "InsuranceOrganizationUser_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "InsuranceOrganization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InsuranceOrganizationUser" ADD CONSTRAINT "InsuranceOrganizationUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InsurancePolicyType" ADD CONSTRAINT "InsurancePolicyType_insuranceLineId_fkey" FOREIGN KEY ("insuranceLineId") REFERENCES "InsuranceLine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InsuranceDisclosureTemplate" ADD CONSTRAINT "InsuranceDisclosureTemplate_createdByAdminUserId_fkey" FOREIGN KEY ("createdByAdminUserId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InsuranceDisclosureTemplate" ADD CONSTRAINT "InsuranceDisclosureTemplate_publishedByAdminUserId_fkey" FOREIGN KEY ("publishedByAdminUserId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InsuranceConsentTemplate" ADD CONSTRAINT "InsuranceConsentTemplate_createdByAdminUserId_fkey" FOREIGN KEY ("createdByAdminUserId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InsuranceConsentTemplate" ADD CONSTRAINT "InsuranceConsentTemplate_publishedByAdminUserId_fkey" FOREIGN KEY ("publishedByAdminUserId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InsuranceConfigurationHistory" ADD CONSTRAINT "InsuranceConfigurationHistory_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
