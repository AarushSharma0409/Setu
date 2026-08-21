-- Sprint I6: provider integration metadata, secure handoff records and callback replay protection.
CREATE TYPE "InsuranceIntegrationProviderType" AS ENUM ('INSURER', 'BROKER', 'AGGREGATOR', 'OTHER_APPROVED_PROVIDER');
CREATE TYPE "InsuranceIntegrationEnvironment" AS ENUM ('SANDBOX', 'PRODUCTION');
CREATE TYPE "InsuranceIntegrationStatus" AS ENUM ('DRAFT', 'ACTIVE', 'SUSPENDED', 'DISABLED');
CREATE TYPE "InsuranceProviderAuthType" AS ENUM ('API_KEY', 'BASIC', 'OAUTH2_CLIENT_CREDENTIALS', 'JWT_CLIENT_ASSERTION', 'MUTUAL_TLS', 'SIGNED_REQUEST', 'CUSTOM');
CREATE TYPE "InsuranceProviderHealthStatus" AS ENUM ('UNKNOWN', 'HEALTHY', 'DEGRADED', 'UNAVAILABLE');
CREATE TYPE "InsuranceProviderMappingStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "InsuranceProviderRequestOperation" AS ENUM ('QUOTE', 'HANDOFF', 'CALLBACK', 'STATUS_LOOKUP');
CREATE TYPE "InsuranceProviderRequestStatus" AS ENUM ('STARTED', 'SUCCEEDED', 'FAILED', 'RETRYING');
CREATE TYPE "InsuranceProviderErrorCategory" AS ENUM ('AUTHENTICATION', 'AUTHORIZATION', 'VALIDATION', 'PRODUCT_UNAVAILABLE', 'CUSTOMER_INELIGIBLE', 'RATE_LIMITED', 'TIMEOUT', 'NETWORK', 'PROVIDER_UNAVAILABLE', 'PROVIDER_ERROR', 'INVALID_RESPONSE', 'CONFIGURATION', 'SYSTEM');
CREATE TYPE "InsurancePurchaseHandoffStatus" AS ENUM ('CREATED', 'READY', 'REDIRECTED', 'ACKNOWLEDGED', 'COMPLETED', 'FAILED', 'EXPIRED', 'CANCELLED');
CREATE TYPE "InsuranceHandoffDestinationType" AS ENUM ('PROVIDER_REDIRECT');
CREATE TYPE "InsuranceRedirectEventType" AS ENUM ('HANDOFF_CREATED', 'REDIRECT_INITIATED', 'REDIRECT_COMPLETED', 'RETURN_RECEIVED');
CREATE TYPE "InsuranceProviderEventStatus" AS ENUM ('RECEIVED', 'PROCESSED', 'REJECTED', 'FAILED');
CREATE TYPE "InsuranceExternalConversionStatus" AS ENUM ('UNKNOWN', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED');

CREATE TABLE "InsuranceIntegrationProvider" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "organizationId" UUID NOT NULL,
  "code" TEXT NOT NULL, "name" TEXT NOT NULL, "type" "InsuranceIntegrationProviderType" NOT NULL,
  "environment" "InsuranceIntegrationEnvironment" NOT NULL, "status" "InsuranceIntegrationStatus" NOT NULL DEFAULT 'DRAFT',
  "authType" "InsuranceProviderAuthType" NOT NULL, "baseUrlReference" TEXT NOT NULL,
  "secretReference" TEXT, "credentialVersion" TEXT, "lastRotatedAt" TIMESTAMP(3), "timeoutMs" INTEGER NOT NULL,
  "retryPolicy" JSONB NOT NULL DEFAULT '{}', "capabilities" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "healthStatus" "InsuranceProviderHealthStatus" NOT NULL DEFAULT 'UNKNOWN', "lastHealthCheckAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InsuranceIntegrationProvider_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "InsuranceIntegrationProvider_code_environment_key" ON "InsuranceIntegrationProvider"("code", "environment");
CREATE INDEX "InsuranceIntegrationProvider_organizationId_idx" ON "InsuranceIntegrationProvider"("organizationId");
CREATE INDEX "InsuranceIntegrationProvider_status_environment_idx" ON "InsuranceIntegrationProvider"("status", "environment");

CREATE TABLE "InsuranceProviderProductMapping" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "integrationProviderId" UUID NOT NULL, "productId" UUID NOT NULL,
  "productVersionId" UUID, "externalProductCode" TEXT NOT NULL, "externalPlanCode" TEXT, "externalVariantCode" TEXT,
  "status" "InsuranceProviderMappingStatus" NOT NULL DEFAULT 'ACTIVE', "effectiveFrom" TIMESTAMP(3) NOT NULL,
  "effectiveUntil" TIMESTAMP(3), "metadata" JSONB NOT NULL DEFAULT '{}', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "InsuranceProviderProductMapping_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "InsuranceProviderProductMapping_provider_product_version_code_key" ON "InsuranceProviderProductMapping"("integrationProviderId", "productId", "productVersionId", "externalProductCode");
CREATE INDEX "InsuranceProviderProductMapping_provider_active_idx" ON "InsuranceProviderProductMapping"("integrationProviderId", "status", "effectiveFrom", "effectiveUntil");
CREATE INDEX "InsuranceProviderProductMapping_productId_status_idx" ON "InsuranceProviderProductMapping"("productId", "status");

CREATE TABLE "InsuranceProviderRequest" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "quoteRequestId" UUID, "quoteId" UUID, "integrationProviderId" UUID NOT NULL,
  "operationType" "InsuranceProviderRequestOperation" NOT NULL, "externalReference" TEXT, "requestHash" TEXT NOT NULL,
  "status" "InsuranceProviderRequestStatus" NOT NULL DEFAULT 'STARTED', "errorCategory" "InsuranceProviderErrorCategory",
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "completedAt" TIMESTAMP(3), "durationMs" INTEGER,
  "attemptNumber" INTEGER NOT NULL DEFAULT 1, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InsuranceProviderRequest_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "InsuranceProviderRequest_provider_createdAt_idx" ON "InsuranceProviderRequest"("integrationProviderId", "createdAt");
CREATE INDEX "InsuranceProviderRequest_quoteRequestId_idx" ON "InsuranceProviderRequest"("quoteRequestId");
CREATE INDEX "InsuranceProviderRequest_quoteId_idx" ON "InsuranceProviderRequest"("quoteId");
CREATE INDEX "InsuranceProviderRequest_status_createdAt_idx" ON "InsuranceProviderRequest"("status", "createdAt");

CREATE TABLE "InsurancePurchaseHandoff" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "referenceNumber" TEXT NOT NULL, "userId" UUID NOT NULL,
  "quoteRequestId" UUID NOT NULL, "quoteId" UUID NOT NULL, "organizationId" UUID NOT NULL, "productId" UUID NOT NULL,
  "integrationProviderId" UUID NOT NULL, "status" "InsurancePurchaseHandoffStatus" NOT NULL DEFAULT 'CREATED',
  "destinationType" "InsuranceHandoffDestinationType" NOT NULL DEFAULT 'PROVIDER_REDIRECT', "externalReference" TEXT,
  "stateTokenHash" TEXT NOT NULL, "attribution" JSONB NOT NULL DEFAULT '{}', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL, "redirectedAt" TIMESTAMP(3), "completedAt" TIMESTAMP(3), "failedAt" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "InsurancePurchaseHandoff_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "InsurancePurchaseHandoff_referenceNumber_key" ON "InsurancePurchaseHandoff"("referenceNumber");
CREATE UNIQUE INDEX "InsurancePurchaseHandoff_stateTokenHash_key" ON "InsurancePurchaseHandoff"("stateTokenHash");
CREATE INDEX "InsurancePurchaseHandoff_userId_createdAt_idx" ON "InsurancePurchaseHandoff"("userId", "createdAt");
CREATE INDEX "InsurancePurchaseHandoff_quoteId_status_idx" ON "InsurancePurchaseHandoff"("quoteId", "status");
CREATE INDEX "InsurancePurchaseHandoff_provider_status_idx" ON "InsurancePurchaseHandoff"("integrationProviderId", "status");
CREATE INDEX "InsurancePurchaseHandoff_expiresAt_idx" ON "InsurancePurchaseHandoff"("expiresAt");

CREATE TABLE "InsuranceRedirectEvent" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "handoffId" UUID NOT NULL, "userId" UUID NOT NULL, "quoteId" UUID NOT NULL,
  "integrationProviderId" UUID NOT NULL, "eventType" "InsuranceRedirectEventType" NOT NULL, "destinationHost" TEXT,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InsuranceRedirectEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "InsuranceRedirectEvent_handoffId_occurredAt_idx" ON "InsuranceRedirectEvent"("handoffId", "occurredAt");
CREATE INDEX "InsuranceRedirectEvent_provider_occurredAt_idx" ON "InsuranceRedirectEvent"("integrationProviderId", "occurredAt");

CREATE TABLE "InsuranceProviderEvent" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "integrationProviderId" UUID NOT NULL, "handoffId" UUID,
  "externalEventId" TEXT NOT NULL, "eventType" TEXT NOT NULL, "payloadHash" TEXT NOT NULL,
  "status" "InsuranceProviderEventStatus" NOT NULL DEFAULT 'RECEIVED', "mappedStatus" "InsurancePurchaseHandoffStatus",
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "processedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InsuranceProviderEvent_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "InsuranceProviderEvent_provider_externalEvent_key" ON "InsuranceProviderEvent"("integrationProviderId", "externalEventId");
CREATE INDEX "InsuranceProviderEvent_provider_status_receivedAt_idx" ON "InsuranceProviderEvent"("integrationProviderId", "status", "receivedAt");

CREATE TABLE "InsuranceExternalConversion" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "handoffId" UUID NOT NULL, "integrationProviderId" UUID NOT NULL,
  "externalReference" TEXT, "status" "InsuranceExternalConversionStatus" NOT NULL DEFAULT 'UNKNOWN', "externalStatus" TEXT,
  "convertedAt" TIMESTAMP(3), "lastUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InsuranceExternalConversion_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "InsuranceExternalConversion_handoffId_key" ON "InsuranceExternalConversion"("handoffId");
CREATE INDEX "InsuranceExternalConversion_provider_status_idx" ON "InsuranceExternalConversion"("integrationProviderId", "status");

ALTER TABLE "InsuranceIntegrationProvider" ADD CONSTRAINT "InsuranceIntegrationProvider_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "InsuranceOrganization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InsuranceProviderProductMapping" ADD CONSTRAINT "InsuranceProviderProductMapping_providerId_fkey" FOREIGN KEY ("integrationProviderId") REFERENCES "InsuranceIntegrationProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InsuranceProviderProductMapping" ADD CONSTRAINT "InsuranceProviderProductMapping_productId_fkey" FOREIGN KEY ("productId") REFERENCES "InsuranceProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InsuranceProviderProductMapping" ADD CONSTRAINT "InsuranceProviderProductMapping_productVersionId_fkey" FOREIGN KEY ("productVersionId") REFERENCES "InsuranceProductVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InsuranceProviderRequest" ADD CONSTRAINT "InsuranceProviderRequest_quoteRequestId_fkey" FOREIGN KEY ("quoteRequestId") REFERENCES "InsuranceQuoteRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InsuranceProviderRequest" ADD CONSTRAINT "InsuranceProviderRequest_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "InsuranceQuote"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InsuranceProviderRequest" ADD CONSTRAINT "InsuranceProviderRequest_providerId_fkey" FOREIGN KEY ("integrationProviderId") REFERENCES "InsuranceIntegrationProvider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InsurancePurchaseHandoff" ADD CONSTRAINT "InsurancePurchaseHandoff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InsurancePurchaseHandoff" ADD CONSTRAINT "InsurancePurchaseHandoff_quoteRequestId_fkey" FOREIGN KEY ("quoteRequestId") REFERENCES "InsuranceQuoteRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InsurancePurchaseHandoff" ADD CONSTRAINT "InsurancePurchaseHandoff_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "InsuranceQuote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InsurancePurchaseHandoff" ADD CONSTRAINT "InsurancePurchaseHandoff_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "InsuranceOrganization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InsurancePurchaseHandoff" ADD CONSTRAINT "InsurancePurchaseHandoff_productId_fkey" FOREIGN KEY ("productId") REFERENCES "InsuranceProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InsurancePurchaseHandoff" ADD CONSTRAINT "InsurancePurchaseHandoff_providerId_fkey" FOREIGN KEY ("integrationProviderId") REFERENCES "InsuranceIntegrationProvider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InsuranceRedirectEvent" ADD CONSTRAINT "InsuranceRedirectEvent_handoffId_fkey" FOREIGN KEY ("handoffId") REFERENCES "InsurancePurchaseHandoff"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InsuranceRedirectEvent" ADD CONSTRAINT "InsuranceRedirectEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InsuranceRedirectEvent" ADD CONSTRAINT "InsuranceRedirectEvent_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "InsuranceQuote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InsuranceRedirectEvent" ADD CONSTRAINT "InsuranceRedirectEvent_providerId_fkey" FOREIGN KEY ("integrationProviderId") REFERENCES "InsuranceIntegrationProvider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InsuranceProviderEvent" ADD CONSTRAINT "InsuranceProviderEvent_providerId_fkey" FOREIGN KEY ("integrationProviderId") REFERENCES "InsuranceIntegrationProvider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InsuranceProviderEvent" ADD CONSTRAINT "InsuranceProviderEvent_handoffId_fkey" FOREIGN KEY ("handoffId") REFERENCES "InsurancePurchaseHandoff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InsuranceExternalConversion" ADD CONSTRAINT "InsuranceExternalConversion_handoffId_fkey" FOREIGN KEY ("handoffId") REFERENCES "InsurancePurchaseHandoff"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InsuranceExternalConversion" ADD CONSTRAINT "InsuranceExternalConversion_providerId_fkey" FOREIGN KEY ("integrationProviderId") REFERENCES "InsuranceIntegrationProvider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
