-- Sprint I4: quote requests, deterministic eligibility, internal/manual rate cards,
-- calculation provenance, and normalized immutable quote results.
CREATE TYPE "InsuranceQuoteRequestStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'PARTIALLY_COMPLETED', 'FAILED', 'EXPIRED', 'CANCELLED');
CREATE TYPE "InsuranceQuoteSourceMode" AS ENUM ('MANUAL_RATE_CARD', 'INTERNAL_RULE_ENGINE');
CREATE TYPE "InsuranceEligibilityEvaluationStatus" AS ENUM ('ELIGIBLE', 'INELIGIBLE', 'UNDETERMINED', 'ERROR');
CREATE TYPE "InsuranceEligibilityReasonSeverity" AS ENUM ('INFO', 'WARNING', 'ERROR');
CREATE TYPE "InsuranceRateCardStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'RETIRED');
CREATE TYPE "InsuranceQuoteAttemptStatus" AS ENUM ('SUCCESS', 'INELIGIBLE', 'UNAVAILABLE', 'FAILED');
CREATE TYPE "InsuranceQuoteFailureCategory" AS ENUM ('ELIGIBILITY', 'CONFIGURATION', 'PRICING', 'PROVIDER_UNAVAILABLE', 'VALIDATION', 'SYSTEM');
CREATE TYPE "InsuranceQuoteStatus" AS ENUM ('GENERATED', 'INELIGIBLE', 'UNAVAILABLE', 'FAILED', 'EXPIRED', 'SUPERSEDED');

CREATE TABLE "InsuranceQuoteRequest" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "referenceNumber" TEXT NOT NULL,
  "userId" UUID NOT NULL,
  "assessmentId" UUID NOT NULL,
  "needProfileSnapshotId" UUID NOT NULL,
  "policyTypeId" UUID NOT NULL,
  "status" "InsuranceQuoteRequestStatus" NOT NULL DEFAULT 'PENDING',
  "sourceMode" "InsuranceQuoteSourceMode" NOT NULL DEFAULT 'MANUAL_RATE_CARD',
  "idempotencyKey" TEXT NOT NULL,
  "requestHash" TEXT NOT NULL,
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processingStartedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "recalculationOfQuoteRequestId" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InsuranceQuoteRequest_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "InsuranceQuoteRequest_referenceNumber_key" ON "InsuranceQuoteRequest"("referenceNumber");
CREATE UNIQUE INDEX "InsuranceQuoteRequest_userId_idempotencyKey_key" ON "InsuranceQuoteRequest"("userId", "idempotencyKey");
CREATE INDEX "InsuranceQuoteRequest_userId_requestedAt_idx" ON "InsuranceQuoteRequest"("userId", "requestedAt");
CREATE INDEX "InsuranceQuoteRequest_status_requestedAt_idx" ON "InsuranceQuoteRequest"("status", "requestedAt");
CREATE INDEX "InsuranceQuoteRequest_assessmentId_idx" ON "InsuranceQuoteRequest"("assessmentId");

CREATE TABLE "InsuranceEligibilityEvaluation" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "quoteRequestId" UUID NOT NULL,
  "productId" UUID NOT NULL,
  "productVersionId" UUID NOT NULL,
  "status" "InsuranceEligibilityEvaluationStatus" NOT NULL,
  "engineVersion" TEXT NOT NULL,
  "evaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InsuranceEligibilityEvaluation_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "InsuranceEligibilityEvaluation_quoteRequestId_status_idx" ON "InsuranceEligibilityEvaluation"("quoteRequestId", "status");
CREATE INDEX "InsuranceEligibilityEvaluation_productId_productVersionId_idx" ON "InsuranceEligibilityEvaluation"("productId", "productVersionId");

CREATE TABLE "InsuranceEligibilityReason" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "evaluationId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "ruleType" "InsuranceEligibilityRuleType",
  "severity" "InsuranceEligibilityReasonSeverity" NOT NULL DEFAULT 'INFO',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InsuranceEligibilityReason_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "InsuranceEligibilityReason_evaluationId_idx" ON "InsuranceEligibilityReason"("evaluationId");

CREATE TABLE "InsuranceRateCard" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "organizationId" UUID NOT NULL,
  "productId" UUID NOT NULL,
  "productVersionId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "status" "InsuranceRateCardStatus" NOT NULL DEFAULT 'DRAFT',
  "effectiveFrom" TIMESTAMP(3) NOT NULL,
  "effectiveUntil" TIMESTAMP(3),
  "currency" CHAR(3) NOT NULL DEFAULT 'INR',
  "createdByAdminUserId" UUID NOT NULL,
  "approvedByAdminUserId" UUID,
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InsuranceRateCard_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "InsuranceRateCard_productVersionId_version_key" ON "InsuranceRateCard"("productVersionId", "version");
CREATE INDEX "InsuranceRateCard_productVersionId_status_effectiveFrom_effectiveUntil_idx" ON "InsuranceRateCard"("productVersionId", "status", "effectiveFrom", "effectiveUntil");

CREATE TABLE "InsuranceRateCardEntry" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "rateCardId" UUID NOT NULL,
  "ageMin" INTEGER,
  "ageMax" INTEGER,
  "sumInsured" DECIMAL(14,2),
  "memberConfiguration" TEXT,
  "locationClass" TEXT,
  "policyTerm" INTEGER,
  "basePremium" DECIMAL(14,2) NOT NULL,
  "addonPremium" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "deductibleAdjustment" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "otherAdjustments" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "taxAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InsuranceRateCardEntry_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "InsuranceRateCardEntry_rateCardId_sortOrder_idx" ON "InsuranceRateCardEntry"("rateCardId", "sortOrder");

CREATE TABLE "InsuranceQuoteAttempt" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "quoteRequestId" UUID NOT NULL,
  "productId" UUID NOT NULL,
  "productVersionId" UUID NOT NULL,
  "providerType" "InsuranceQuoteSourceMode" NOT NULL DEFAULT 'MANUAL_RATE_CARD',
  "providerVersion" TEXT,
  "status" "InsuranceQuoteAttemptStatus" NOT NULL,
  "failureCode" TEXT,
  "failureCategory" "InsuranceQuoteFailureCategory",
  "internalMessage" TEXT,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  "durationMs" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InsuranceQuoteAttempt_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "InsuranceQuoteAttempt_quoteRequestId_status_idx" ON "InsuranceQuoteAttempt"("quoteRequestId", "status");

CREATE TABLE "InsuranceQuoteCalculationInput" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "quoteRequestId" UUID NOT NULL,
  "productId" UUID NOT NULL,
  "productVersionId" UUID NOT NULL,
  "providerType" "InsuranceQuoteSourceMode" NOT NULL,
  "providerVersion" TEXT NOT NULL,
  "inputSnapshot" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InsuranceQuoteCalculationInput_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "InsuranceQuoteCalculationInput_quoteRequestId_idx" ON "InsuranceQuoteCalculationInput"("quoteRequestId");

CREATE TABLE "InsuranceQuote" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "quoteRequestId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "organizationId" UUID NOT NULL,
  "productId" UUID NOT NULL,
  "productVersionId" UUID NOT NULL,
  "policyTypeId" UUID NOT NULL,
  "status" "InsuranceQuoteStatus" NOT NULL,
  "currency" CHAR(3),
  "basePremium" DECIMAL(14,2),
  "addonPremium" DECIMAL(14,2),
  "deductibleAdjustment" DECIMAL(14,2),
  "otherAdjustments" DECIMAL(14,2),
  "taxAmount" DECIMAL(14,2),
  "totalPremium" DECIMAL(14,2),
  "sumInsured" DECIMAL(14,2),
  "policyTerm" INTEGER,
  "deductibleSummary" TEXT,
  "waitingPeriodSummary" TEXT,
  "coverageSummary" TEXT,
  "exclusionSummary" TEXT,
  "addonSummary" TEXT,
  "sourceType" "InsuranceQuoteSourceMode" NOT NULL,
  "sourceReference" TEXT,
  "calculationVersion" TEXT NOT NULL,
  "resultSnapshot" JSONB NOT NULL,
  "validFrom" TIMESTAMP(3),
  "validUntil" TIMESTAMP(3),
  "generatedAt" TIMESTAMP(3),
  "expiredAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InsuranceQuote_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "InsuranceQuote_quoteRequestId_status_idx" ON "InsuranceQuote"("quoteRequestId", "status");
CREATE INDEX "InsuranceQuote_userId_createdAt_idx" ON "InsuranceQuote"("userId", "createdAt");
CREATE INDEX "InsuranceQuote_productId_productVersionId_idx" ON "InsuranceQuote"("productId", "productVersionId");

ALTER TABLE "InsuranceQuoteRequest" ADD CONSTRAINT "InsuranceQuoteRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InsuranceQuoteRequest" ADD CONSTRAINT "InsuranceQuoteRequest_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "InsuranceNeedAssessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InsuranceQuoteRequest" ADD CONSTRAINT "InsuranceQuoteRequest_needProfileSnapshotId_fkey" FOREIGN KEY ("needProfileSnapshotId") REFERENCES "InsuranceNeedProfileSnapshot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InsuranceQuoteRequest" ADD CONSTRAINT "InsuranceQuoteRequest_policyTypeId_fkey" FOREIGN KEY ("policyTypeId") REFERENCES "InsurancePolicyType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InsuranceQuoteRequest" ADD CONSTRAINT "InsuranceQuoteRequest_recalculationOfQuoteRequestId_fkey" FOREIGN KEY ("recalculationOfQuoteRequestId") REFERENCES "InsuranceQuoteRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InsuranceEligibilityEvaluation" ADD CONSTRAINT "InsuranceEligibilityEvaluation_quoteRequestId_fkey" FOREIGN KEY ("quoteRequestId") REFERENCES "InsuranceQuoteRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InsuranceEligibilityEvaluation" ADD CONSTRAINT "InsuranceEligibilityEvaluation_productVersionId_fkey" FOREIGN KEY ("productVersionId") REFERENCES "InsuranceProductVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InsuranceEligibilityReason" ADD CONSTRAINT "InsuranceEligibilityReason_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "InsuranceEligibilityEvaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InsuranceRateCard" ADD CONSTRAINT "InsuranceRateCard_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "InsuranceOrganization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InsuranceRateCard" ADD CONSTRAINT "InsuranceRateCard_productId_fkey" FOREIGN KEY ("productId") REFERENCES "InsuranceProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InsuranceRateCard" ADD CONSTRAINT "InsuranceRateCard_productVersionId_fkey" FOREIGN KEY ("productVersionId") REFERENCES "InsuranceProductVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InsuranceRateCard" ADD CONSTRAINT "InsuranceRateCard_createdByAdminUserId_fkey" FOREIGN KEY ("createdByAdminUserId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InsuranceRateCard" ADD CONSTRAINT "InsuranceRateCard_approvedByAdminUserId_fkey" FOREIGN KEY ("approvedByAdminUserId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InsuranceRateCardEntry" ADD CONSTRAINT "InsuranceRateCardEntry_rateCardId_fkey" FOREIGN KEY ("rateCardId") REFERENCES "InsuranceRateCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InsuranceQuoteAttempt" ADD CONSTRAINT "InsuranceQuoteAttempt_quoteRequestId_fkey" FOREIGN KEY ("quoteRequestId") REFERENCES "InsuranceQuoteRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InsuranceQuoteAttempt" ADD CONSTRAINT "InsuranceQuoteAttempt_productVersionId_fkey" FOREIGN KEY ("productVersionId") REFERENCES "InsuranceProductVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InsuranceQuoteCalculationInput" ADD CONSTRAINT "InsuranceQuoteCalculationInput_quoteRequestId_fkey" FOREIGN KEY ("quoteRequestId") REFERENCES "InsuranceQuoteRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InsuranceQuoteCalculationInput" ADD CONSTRAINT "InsuranceQuoteCalculationInput_productVersionId_fkey" FOREIGN KEY ("productVersionId") REFERENCES "InsuranceProductVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InsuranceQuote" ADD CONSTRAINT "InsuranceQuote_quoteRequestId_fkey" FOREIGN KEY ("quoteRequestId") REFERENCES "InsuranceQuoteRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InsuranceQuote" ADD CONSTRAINT "InsuranceQuote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InsuranceQuote" ADD CONSTRAINT "InsuranceQuote_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "InsuranceOrganization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InsuranceQuote" ADD CONSTRAINT "InsuranceQuote_productId_fkey" FOREIGN KEY ("productId") REFERENCES "InsuranceProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InsuranceQuote" ADD CONSTRAINT "InsuranceQuote_productVersionId_fkey" FOREIGN KEY ("productVersionId") REFERENCES "InsuranceProductVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InsuranceQuote" ADD CONSTRAINT "InsuranceQuote_policyTypeId_fkey" FOREIGN KEY ("policyTypeId") REFERENCES "InsurancePolicyType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
