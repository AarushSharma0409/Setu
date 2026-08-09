-- RenameForeignKey
ALTER TABLE "InsuranceExternalConversion" RENAME CONSTRAINT "InsuranceExternalConversion_providerId_fkey" TO "InsuranceExternalConversion_integrationProviderId_fkey";

-- RenameForeignKey
ALTER TABLE "InsuranceProviderEvent" RENAME CONSTRAINT "InsuranceProviderEvent_providerId_fkey" TO "InsuranceProviderEvent_integrationProviderId_fkey";

-- RenameForeignKey
ALTER TABLE "InsuranceProviderProductMapping" RENAME CONSTRAINT "InsuranceProviderProductMapping_providerId_fkey" TO "InsuranceProviderProductMapping_integrationProviderId_fkey";

-- RenameForeignKey
ALTER TABLE "InsuranceProviderRequest" RENAME CONSTRAINT "InsuranceProviderRequest_providerId_fkey" TO "InsuranceProviderRequest_integrationProviderId_fkey";

-- RenameForeignKey
ALTER TABLE "InsurancePurchaseHandoff" RENAME CONSTRAINT "InsurancePurchaseHandoff_providerId_fkey" TO "InsurancePurchaseHandoff_integrationProviderId_fkey";

-- RenameForeignKey
ALTER TABLE "InsuranceRedirectEvent" RENAME CONSTRAINT "InsuranceRedirectEvent_providerId_fkey" TO "InsuranceRedirectEvent_integrationProviderId_fkey";

-- RenameIndex
ALTER INDEX "InsuranceExternalConversion_provider_status_idx" RENAME TO "InsuranceExternalConversion_integrationProviderId_status_idx";

-- RenameIndex
ALTER INDEX "InsuranceProviderEvent_provider_externalEvent_key" RENAME TO "InsuranceProviderEvent_integrationProviderId_externalEventI_key";

-- RenameIndex
ALTER INDEX "InsuranceProviderEvent_provider_status_receivedAt_idx" RENAME TO "InsuranceProviderEvent_integrationProviderId_status_receive_idx";

-- RenameIndex
ALTER INDEX "InsuranceProviderProductMapping_provider_active_idx" RENAME TO "InsuranceProviderProductMapping_integrationProviderId_statu_idx";

-- RenameIndex
ALTER INDEX "InsuranceProviderProductMapping_provider_product_version_code_k" RENAME TO "InsuranceProviderProductMapping_integrationProviderId_produ_key";

-- RenameIndex
ALTER INDEX "InsuranceProviderRequest_provider_createdAt_idx" RENAME TO "InsuranceProviderRequest_integrationProviderId_createdAt_idx";

-- RenameIndex
ALTER INDEX "InsurancePurchaseHandoff_provider_status_idx" RENAME TO "InsurancePurchaseHandoff_integrationProviderId_status_idx";

-- RenameIndex
ALTER INDEX "InsuranceRedirectEvent_provider_occurredAt_idx" RENAME TO "InsuranceRedirectEvent_integrationProviderId_occurredAt_idx";
