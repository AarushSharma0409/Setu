import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { EnvService } from "../../common/env/env.service";

@Injectable()
export class InsuranceNeedsFeatureGuard implements CanActivate {
  constructor(private readonly env: EnvService) {}
  canActivate(_context: ExecutionContext) {
    if (
      !this.env.values.INSURANCE_FEATURE_ENABLED ||
      !this.env.values.INSURANCE_CUSTOMER_NEEDS_ENABLED
    )
      throw new NotFoundException("Insurance needs assessment is unavailable");
    return true;
  }
}
