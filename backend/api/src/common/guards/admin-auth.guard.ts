import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { AccountStatus } from "@prisma/client";

import type {
  AuthenticatedPrincipal,
  AuthenticatedRequest,
} from "./authenticated-request";
import { PrismaService } from "../../database/prisma.service";
import { EnvService } from "../env/env.service";

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly envService: EnvService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = request.headers.authorization;

    if (!header?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Authentication required");
    }

    try {
      const payload = await this.jwtService.verifyAsync<AuthenticatedPrincipal>(
        header.slice(7),
        {
          audience: "setu-admin",
          secret: this.envService.values.JWT_ACCESS_SECRET,
        },
      );

      if (payload.type !== "admin" || payload.mfa !== true) {
        throw new UnauthorizedException("Authentication required");
      }

      const admin = await this.prisma.adminUser.findUnique({
        where: { id: payload.sub },
        select: { status: true, twoFactorEnabled: true },
      });

      if (
        !admin ||
        admin.status !== AccountStatus.ACTIVE ||
        !admin.twoFactorEnabled
      ) {
        throw new UnauthorizedException("Authentication required");
      }

      request.auth = payload;
      return true;
    } catch {
      throw new UnauthorizedException("Authentication required");
    }
  }
}
