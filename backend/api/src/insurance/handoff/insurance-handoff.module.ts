import { Module } from "@nestjs/common";

import { InsuranceHandoffFeatureGuard } from "./insurance-handoff-feature.guard";
import { InsuranceHandoffController } from "./insurance-handoff.controller";
import { InsuranceHandoffService } from "./insurance-handoff.service";
import { AuthModule } from "../../auth/auth.module";
import { InsuranceCapabilityServiceImpl } from "../insurance-capability.service";
import { InsuranceIntegrationsModule } from "../integrations/insurance-integrations.module";

@Module({
  imports: [AuthModule, InsuranceIntegrationsModule],
  controllers: [InsuranceHandoffController],
  providers: [
    InsuranceHandoffService,
    InsuranceHandoffFeatureGuard,
    InsuranceCapabilityServiceImpl,
  ],
  exports: [InsuranceHandoffService],
})
export class InsuranceHandoffModule {}
