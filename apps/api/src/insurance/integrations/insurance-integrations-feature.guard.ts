import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { EnvService } from "../../common/env/env.service";

@Injectable()
export class InsuranceIntegrationsFeatureGuard implements CanActivate {
  constructor(private readonly env: EnvService) {}
  canActivate(_context: ExecutionContext) {
    if (
      !this.env.values.INSURANCE_FEATURE_ENABLED ||
      !this.env.values.INSURANCE_PROVIDER_INTEGRATIONS_ENABLED
    ) {
      throw new NotFoundException(
        "Insurance provider integrations are unavailable",
      );
    }
    return true;
  }
}
