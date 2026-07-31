import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

import type {
  AuthenticatedPrincipal,
  AuthenticatedRequest,
} from "./authenticated-request";
import { EnvService } from "../env/env.service";

@Injectable()
export class PublicUserAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly envService: EnvService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = extractBearerToken(request);

    if (!token) {
      throw new UnauthorizedException("Authentication required");
    }

    try {
      const payload = await this.jwtService.verifyAsync<AuthenticatedPrincipal>(
        token,
        {
          audience: "setu-public",
          secret: this.envService.values.JWT_ACCESS_SECRET,
        },
      );

      if (payload.type !== "public") {
        throw new UnauthorizedException("Authentication required");
      }

      request.auth = payload;
      return true;
    } catch {
      throw new UnauthorizedException("Authentication required");
    }
  }
}

function extractBearerToken(request: AuthenticatedRequest): string | undefined {
  const header = request.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return undefined;
  }

  return header.slice("Bearer ".length);
}
