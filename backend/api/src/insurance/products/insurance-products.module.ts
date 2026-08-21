import { Module } from "@nestjs/common";

import { InsuranceProductsController } from "./insurance-products.controller";
import { InsuranceProductsService } from "./insurance-products.service";
import { InsuranceProductCatalogueFeatureGuard } from "./product-catalogue-feature.guard";
import { AuditModule } from "../../audit/audit.module";
import { AuthModule } from "../../auth/auth.module";
import { StorageModule } from "../../storage/storage.module";
import { InsuranceCapabilityServiceImpl } from "../insurance-capability.service";

@Module({
  imports: [AuthModule, AuditModule, StorageModule],
  controllers: [InsuranceProductsController],
  providers: [
    InsuranceProductsService,
    InsuranceProductCatalogueFeatureGuard,
    InsuranceCapabilityServiceImpl,
  ],
})
export class InsuranceProductsModule {}
