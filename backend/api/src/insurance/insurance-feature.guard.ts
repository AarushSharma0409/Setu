import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { EnvService } from "../common/env/env.service";

/** Server-side feature boundary. The insurance admin surface is fail-closed. */
@Injectable()
export class InsuranceFeatureGuard implements CanActivate {
  constructor(private readonly env: EnvService) {}

  canActivate(_context: ExecutionContext): boolean {
    if (
      !this.env.values.INSURANCE_FEATURE_ENABLED ||
      !this.env.values.INSURANCE_ADMIN_ENABLED
    ) {
      throw new NotFoundException("Insurance administration is unavailable");
    }
    return true;
  }
}
