-- Sprint I5: saved quotes, versioned transparent ranking methodologies, and
-- immutable ranking results. Comparison itself remains a computed read model.
CREATE TYPE "InsuranceRankingMethodologyStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'RETIRED');
CREATE TYPE "InsuranceRankingMethodologyType" AS ENUM ('RULE_BASED_SCORE', 'CUSTOMER_PREFERENCE_MATCH', 'NEUTRAL_SORT');
CREATE TYPE "InsuranceComparisonSortMode" AS ENUM ('DEFAULT', 'LOWEST_PREMIUM', 'HIGHEST_COVER', 'LOWEST_DEDUCTIBLE', 'SHORTEST_WAITING_PERIOD', 'INSURER_NAME', 'PRODUCT_NAME');

CREATE TABLE "InsuranceSavedQuote" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "quoteId" UUID NOT NULL,
  "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InsuranceSavedQuote_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "InsuranceSavedQuote_userId_quoteId_key" ON "InsuranceSavedQuote"("userId", "quoteId");
CREATE INDEX "InsuranceSavedQuote_userId_savedAt_idx" ON "InsuranceSavedQuote"("userId", "savedAt");

CREATE TABLE "InsuranceRankingMethodology" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "policyTypeId" UUID NOT NULL,
  "version" INTEGER NOT NULL,
  "status" "InsuranceRankingMethodologyStatus" NOT NULL DEFAULT 'DRAFT',
  "effectiveFrom" TIMESTAMP(3),
  "effectiveUntil" TIMESTAMP(3),
  "methodologyType" "InsuranceRankingMethodologyType" NOT NULL,
  "configuration" JSONB NOT NULL,
  "customerExplanation" TEXT NOT NULL,
  "createdByAdminUserId" UUID NOT NULL,
  "publishedByAdminUserId" UUID,
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InsuranceRankingMethodology_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "InsuranceRankingMethodology_code_policyTypeId_version_key" ON "InsuranceRankingMethodology"("code", "policyTypeId", "version");
CREATE INDEX "InsuranceRankingMethodology_policyTypeId_status_effectiveFrom_effectiveUntil_idx" ON "InsuranceRankingMethodology"("policyTypeId", "status", "effectiveFrom", "effectiveUntil");

CREATE TABLE "InsuranceQuoteRanking" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "quoteRequestId" UUID NOT NULL,
  "quoteId" UUID NOT NULL,
  "rankingMethodologyId" UUID NOT NULL,
  "rankingMethodologyVersion" INTEGER NOT NULL,
  "score" DECIMAL(7,2) NOT NULL,
  "rank" INTEGER NOT NULL,
  "explanationJson" JSONB NOT NULL,
  "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InsuranceQuoteRanking_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "InsuranceQuoteRanking_quoteRequestId_quoteId_rankingMethodologyId_key" ON "InsuranceQuoteRanking"("quoteRequestId", "quoteId", "rankingMethodologyId");
CREATE INDEX "InsuranceQuoteRanking_quoteRequestId_rank_idx" ON "InsuranceQuoteRanking"("quoteRequestId", "rank");

ALTER TABLE "InsuranceSavedQuote" ADD CONSTRAINT "InsuranceSavedQuote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InsuranceSavedQuote" ADD CONSTRAINT "InsuranceSavedQuote_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "InsuranceQuote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InsuranceRankingMethodology" ADD CONSTRAINT "InsuranceRankingMethodology_policyTypeId_fkey" FOREIGN KEY ("policyTypeId") REFERENCES "InsurancePolicyType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InsuranceRankingMethodology" ADD CONSTRAINT "InsuranceRankingMethodology_createdByAdminUserId_fkey" FOREIGN KEY ("createdByAdminUserId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InsuranceRankingMethodology" ADD CONSTRAINT "InsuranceRankingMethodology_publishedByAdminUserId_fkey" FOREIGN KEY ("publishedByAdminUserId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InsuranceQuoteRanking" ADD CONSTRAINT "InsuranceQuoteRanking_quoteRequestId_fkey" FOREIGN KEY ("quoteRequestId") REFERENCES "InsuranceQuoteRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InsuranceQuoteRanking" ADD CONSTRAINT "InsuranceQuoteRanking_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "InsuranceQuote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InsuranceQuoteRanking" ADD CONSTRAINT "InsuranceQuoteRanking_rankingMethodologyId_fkey" FOREIGN KEY ("rankingMethodologyId") REFERENCES "InsuranceRankingMethodology"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
