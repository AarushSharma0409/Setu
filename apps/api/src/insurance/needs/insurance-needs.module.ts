import { Module } from "@nestjs/common";

import { AuthModule } from "../../auth/auth.module";
import { InsuranceCapabilityServiceImpl } from "../insurance-capability.service";
import { InsuranceNeedsFeatureGuard } from "./insurance-needs-feature.guard";
import { InsuranceNeedsController } from "./insurance-needs.controller";
import { InsuranceNeedsService } from "./insurance-needs.service";
import { SensitiveAnswerCryptoService } from "./sensitive-answer-crypto.service";

@Module({
  imports: [AuthModule],
  controllers: [InsuranceNeedsController],
  providers: [
    InsuranceNeedsService,
    InsuranceNeedsFeatureGuard,
    SensitiveAnswerCryptoService,
    InsuranceCapabilityServiceImpl,
  ],
})
export class InsuranceNeedsModule {}
