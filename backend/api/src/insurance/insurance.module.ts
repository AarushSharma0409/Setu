import { Module } from "@nestjs/common";

import { InsuranceComparisonModule } from "./comparison/insurance-comparison.module";
import { InsuranceHandoffModule } from "./handoff/insurance-handoff.module";
import { InsuranceCapabilityServiceImpl } from "./insurance-capability.service";
import { InsuranceFeatureGuard } from "./insurance-feature.guard";
import { InsuranceController } from "./insurance.controller";
import { InsuranceService } from "./insurance.service";
import { InsuranceIntegrationsModule } from "./integrations/insurance-integrations.module";
import { InsuranceNeedsModule } from "./needs/insurance-needs.module";
import { InsuranceOperationsModule } from "./operations/insurance-operations.module";
import { InsuranceProductsModule } from "./products/insurance-products.module";
import { InsuranceQuotationsModule } from "./quotations/insurance-quotations.module";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { StorageModule } from "../storage/storage.module";

@Module({
  imports: [
    AuthModule,
    AuditModule,
    StorageModule,
    InsuranceProductsModule,
    InsuranceNeedsModule,
    InsuranceQuotationsModule,
    InsuranceComparisonModule,
    InsuranceIntegrationsModule,
    InsuranceHandoffModule,
    InsuranceOperationsModule,
  ],
  controllers: [InsuranceController],
  providers: [
    InsuranceService,
    InsuranceCapabilityServiceImpl,
    InsuranceFeatureGuard,
  ],
  exports: [InsuranceCapabilityServiceImpl],
})
export class InsuranceModule {}
