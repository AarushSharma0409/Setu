import { Module } from "@nestjs/common";

import { InsuranceOperationsFeatureGuard } from "./insurance-operations-feature.guard";
import { InsuranceOperationsController } from "./insurance-operations.controller";
import { InsuranceOperationsService } from "./insurance-operations.service";
import { AuditModule } from "../../audit/audit.module";
import { AuthModule } from "../../auth/auth.module";
import { InsuranceHandoffModule } from "../handoff/insurance-handoff.module";
import { InsuranceIntegrationsModule } from "../integrations/insurance-integrations.module";
import { InsuranceQuotationsModule } from "../quotations/insurance-quotations.module";

@Module({
  imports: [
    AuthModule,
    AuditModule,
    InsuranceQuotationsModule,
    InsuranceIntegrationsModule,
    InsuranceHandoffModule,
  ],
  controllers: [InsuranceOperationsController],
  providers: [InsuranceOperationsService, InsuranceOperationsFeatureGuard],
})
export class InsuranceOperationsModule {}
