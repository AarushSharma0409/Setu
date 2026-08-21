import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { EnvService } from "../../common/env/env.service";

@Injectable()
export class InsuranceComparisonFeatureGuard implements CanActivate {
  constructor(private readonly env: EnvService) {}

  canActivate(_context: ExecutionContext) {
    if (
      !this.env.values.INSURANCE_FEATURE_ENABLED ||
      !this.env.values.INSURANCE_COMPARISON_ENABLED
    )
      throw new NotFoundException("Insurance comparison is unavailable");
    return true;
  }
}
