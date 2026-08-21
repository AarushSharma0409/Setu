import { Module } from "@nestjs/common";

import { AuditModule } from "../../audit/audit.module";
import { AuthModule } from "../../auth/auth.module";
import { InsuranceCapabilityServiceImpl } from "../insurance-capability.service";
import { InsuranceQuotationsFeatureGuard } from "./insurance-quotations-feature.guard";
import { InsuranceQuotationsController } from "./insurance-quotations.controller";
import { InsuranceQuotationsService } from "./insurance-quotations.service";
import { InsuranceQuoteOperationsController } from "./insurance-quote-operations.controller";

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [
    InsuranceQuotationsController,
    InsuranceQuoteOperationsController,
  ],
  providers: [
    InsuranceQuotationsService,
    InsuranceQuotationsFeatureGuard,
    InsuranceCapabilityServiceImpl,
  ],
  exports: [InsuranceQuotationsService],
})
export class InsuranceQuotationsModule {}
