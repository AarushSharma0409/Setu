import { Module } from "@nestjs/common";

import { InsuranceIntegrationsFeatureGuard } from "./insurance-integrations-feature.guard";
import { InsuranceIntegrationsController } from "./insurance-integrations.controller";
import { InsuranceIntegrationsService } from "./insurance-integrations.service";
import { ProviderAdapterRegistry } from "./provider-adapter.registry";
import { SetuMockProviderAdapter } from "./setu-mock-provider.adapter";
import { AuditModule } from "../../audit/audit.module";
import { AuthModule } from "../../auth/auth.module";
import { InsuranceCapabilityServiceImpl } from "../insurance-capability.service";

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [InsuranceIntegrationsController],
  providers: [
    InsuranceIntegrationsService,
    InsuranceIntegrationsFeatureGuard,
    SetuMockProviderAdapter,
    {
      provide: ProviderAdapterRegistry,
      inject: [SetuMockProviderAdapter],
      useFactory: (mock: SetuMockProviderAdapter) => {
        const registry = new ProviderAdapterRegistry();
        registry.register(mock);
        return registry;
      },
    },
    InsuranceCapabilityServiceImpl,
  ],
  exports: [ProviderAdapterRegistry, InsuranceIntegrationsService],
})
export class InsuranceIntegrationsModule {}
