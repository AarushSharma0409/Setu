import { Module } from "@nestjs/common";

import { AuthModule } from "../../auth/auth.module";
import { InsuranceCapabilityServiceImpl } from "../insurance-capability.service";
import { InsuranceComparisonFeatureGuard } from "./insurance-comparison-feature.guard";
import { InsuranceComparisonController } from "./insurance-comparison.controller";
import { InsuranceComparisonService } from "./insurance-comparison.service";

@Module({
  imports: [AuthModule],
  controllers: [InsuranceComparisonController],
  providers: [
    InsuranceComparisonService,
    InsuranceComparisonFeatureGuard,
    InsuranceCapabilityServiceImpl,
  ],
})
export class InsuranceComparisonModule {}
