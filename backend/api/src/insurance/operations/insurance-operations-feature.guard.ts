import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { EnvService } from "../../common/env/env.service";

@Injectable()
export class InsuranceOperationsFeatureGuard implements CanActivate {
  constructor(private readonly env: EnvService) {}

  canActivate(_context: ExecutionContext) {
    if (
      !this.env.values.INSURANCE_FEATURE_ENABLED ||
      !this.env.values.INSURANCE_ADMIN_ENABLED ||
      !this.env.values.INSURANCE_OPERATIONS_ENABLED
    ) {
      throw new NotFoundException("Insurance operations are unavailable");
    }
    return true;
  }
}
