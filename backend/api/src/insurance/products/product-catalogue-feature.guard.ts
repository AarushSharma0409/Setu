import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { EnvService } from "../../common/env/env.service";

@Injectable()
export class InsuranceProductCatalogueFeatureGuard implements CanActivate {
  constructor(private readonly env: EnvService) {}

  canActivate(_context: ExecutionContext) {
    if (!this.env.values.INSURANCE_PRODUCT_CATALOG_ENABLED) {
      throw new NotFoundException("Insurance product catalogue is unavailable");
    }
    return true;
  }
}
