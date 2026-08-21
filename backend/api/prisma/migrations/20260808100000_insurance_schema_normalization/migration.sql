/*
  Warnings:

  - A unique constraint covering the columns `[storageKey]` on the table `InsuranceProductDocument` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "InsuranceProductVersion" DROP CONSTRAINT "InsuranceProductVersion_approvedByAdminUserId_fkey";

-- CreateIndex
CREATE INDEX "InsuranceConsentRecord_userId_assessmentId_purpose_idx" ON "InsuranceConsentRecord"("userId", "assessmentId", "purpose");

-- CreateIndex
CREATE INDEX "InsuranceDisclosureAcknowledgement_userId_assessmentId_idx" ON "InsuranceDisclosureAcknowledgement"("userId", "assessmentId");

-- CreateIndex
CREATE INDEX "InsuranceNeedAnswer_assessmentId_idx" ON "InsuranceNeedAnswer"("assessmentId");

-- CreateIndex
CREATE INDEX "InsuranceNeedAssessment_policyTypeId_status_idx" ON "InsuranceNeedAssessment"("policyTypeId", "status");

-- CreateIndex
CREATE INDEX "InsuranceNeedProfileSnapshot_policyTypeId_submittedAt_idx" ON "InsuranceNeedProfileSnapshot"("policyTypeId", "submittedAt");

-- CreateIndex
CREATE INDEX "InsuranceProductAddon_productVersionId_sortOrder_idx" ON "InsuranceProductAddon"("productVersionId", "sortOrder");

-- CreateIndex
CREATE INDEX "InsuranceProductAvailability_stateId_idx" ON "InsuranceProductAvailability"("stateId");

-- CreateIndex
CREATE INDEX "InsuranceProductAvailability_cityId_idx" ON "InsuranceProductAvailability"("cityId");

-- CreateIndex
CREATE INDEX "InsuranceProductCoverage_productVersionId_sortOrder_idx" ON "InsuranceProductCoverage"("productVersionId", "sortOrder");

-- CreateIndex
CREATE INDEX "InsuranceProductDeductible_productVersionId_sortOrder_idx" ON "InsuranceProductDeductible"("productVersionId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "InsuranceProductDocument_storageKey_key" ON "InsuranceProductDocument"("storageKey");

-- CreateIndex
CREATE INDEX "InsuranceProductDocument_productVersionId_type_idx" ON "InsuranceProductDocument"("productVersionId", "type");

-- CreateIndex
CREATE INDEX "InsuranceProductEligibilityRule_productVersionId_sortOrder_idx" ON "InsuranceProductEligibilityRule"("productVersionId", "sortOrder");

-- CreateIndex
CREATE INDEX "InsuranceProductExclusion_productVersionId_sortOrder_idx" ON "InsuranceProductExclusion"("productVersionId", "sortOrder");

-- CreateIndex
CREATE INDEX "InsuranceProductSumInsuredOption_productVersionId_sortOrder_idx" ON "InsuranceProductSumInsuredOption"("productVersionId", "sortOrder");

-- CreateIndex
CREATE INDEX "InsuranceProductWaitingPeriod_productVersionId_sortOrder_idx" ON "InsuranceProductWaitingPeriod"("productVersionId", "sortOrder");

-- CreateIndex
CREATE INDEX "InsuranceQuestion_sectionId_sortOrder_idx" ON "InsuranceQuestion"("sectionId", "sortOrder");

-- CreateIndex
CREATE INDEX "InsuranceQuestionOption_questionId_sortOrder_idx" ON "InsuranceQuestionOption"("questionId", "sortOrder");

-- CreateIndex
CREATE INDEX "InsuranceQuestionSection_questionSchemaId_sortOrder_idx" ON "InsuranceQuestionSection"("questionSchemaId", "sortOrder");

-- AddForeignKey
ALTER TABLE "InsuranceProductVersion" ADD CONSTRAINT "InsuranceProductVersion_approvedByAdminUserId_fkey" FOREIGN KEY ("approvedByAdminUserId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceQuestionSchema" ADD CONSTRAINT "InsuranceQuestionSchema_publishedByAdminUserId_fkey" FOREIGN KEY ("publishedByAdminUserId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "InsuranceDisclosureAcknowledgement_assessmentId_disclosureTempl" RENAME TO "InsuranceDisclosureAcknowledgement_assessmentId_disclosureT_key";

-- RenameIndex
ALTER INDEX "InsuranceDisclosureTemplate_code_audience_status_effectiveFrom_" RENAME TO "InsuranceDisclosureTemplate_code_audience_status_effectiveF_idx";

-- RenameIndex
ALTER INDEX "InsuranceOperatingModel_legalEntityName_primaryJurisdiction_con" RENAME TO "InsuranceOperatingModel_legalEntityName_primaryJurisdiction_key";

-- RenameIndex
ALTER INDEX "InsuranceOrganization_registrationNumber_regulatoryAuthority_ke" RENAME TO "InsuranceOrganization_registrationNumber_regulatoryAuthorit_key";

-- RenameIndex
ALTER INDEX "InsuranceProductVersion_productId_status_effectiveFrom_effectiv" RENAME TO "InsuranceProductVersion_productId_status_effectiveFrom_effe_idx";

-- RenameIndex
ALTER INDEX "InsuranceQuestionSchema_policyTypeId_status_effectiveFrom_effec" RENAME TO "InsuranceQuestionSchema_policyTypeId_status_effectiveFrom_e_idx";

-- RenameIndex
ALTER INDEX "InsuranceQuoteRanking_quoteRequestId_quoteId_rankingMethodology" RENAME TO "InsuranceQuoteRanking_quoteRequestId_quoteId_rankingMethodo_key";

-- RenameIndex
ALTER INDEX "InsuranceRankingMethodology_policyTypeId_status_effectiveFrom_e" RENAME TO "InsuranceRankingMethodology_policyTypeId_status_effectiveFr_idx";

-- RenameIndex
ALTER INDEX "InsuranceRateCard_productVersionId_status_effectiveFrom_effecti" RENAME TO "InsuranceRateCard_productVersionId_status_effectiveFrom_eff_idx";
