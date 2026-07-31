import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { AccountStatus, SessionSubjectType, UserRole } from "@prisma/client";

import { EnvService } from "../common/env/env.service";
import { PrismaService } from "../database/prisma.service";
import type { DevLoginDto } from "./dto/dev-login.dto";
import { SessionService } from "./session.service";
import { TokenService } from "./token.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly envService: EnvService,
    private readonly prisma: PrismaService,
    private readonly sessionService: SessionService,
    private readonly tokenService: TokenService,
  ) {}

  async devLogin(dto: DevLoginDto) {
    if (!this.envService.isDevelopmentLike) {
      throw new ForbiddenException("Development login is not available");
    }

    const user = await this.prisma.user.upsert({
      where: dto.email ? { email: dto.email } : { phone: dto.phone },
      create: {
        email: dto.email,
        phone: dto.phone,
        name: dto.name ?? "Development User",
        role: UserRole.USER,
        status: AccountStatus.ACTIVE,
      },
      update: {
        name: dto.name,
      },
    });

    const session = await this.sessionService.createPublicSession(user.id);
    const accessToken = await this.tokenService.signAccessToken({
      sub: user.id,
      email: user.email ?? undefined,
      phone: user.phone ?? undefined,
      role: user.role,
      type: "public",
    });

    return {
      accessToken,
      refreshToken: session.refreshToken,
      user: publicUserView(user),
      warning:
        "Development-only endpoint. It is blocked when NODE_ENV=production.",
    };
  }

  async refresh(refreshToken: string | undefined) {
    if (!refreshToken) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const rotated = await this.sessionService.rotate(
      refreshToken,
      SessionSubjectType.USER,
    );
    const user = await this.prisma.user.findUnique({
      where: { id: rotated.subjectId },
    });

    if (!user || user.status !== AccountStatus.ACTIVE) {
      throw new UnauthorizedException("Authentication required");
    }

    return {
      accessToken: await this.tokenService.signAccessToken({
        sub: user.id,
        email: user.email ?? undefined,
        phone: user.phone ?? undefined,
        role: user.role,
        type: "public",
      }),
      refreshToken: rotated.refreshToken,
      user: publicUserView(user),
    };
  }

  async logout(refreshToken: string | undefined): Promise<void> {
    if (refreshToken) {
      await this.sessionService.revoke(refreshToken);
    }
  }
}

interface PublicUserRecord {
  id: string;
  email: string | null;
  phone: string | null;
  name: string | null;
  role: string;
  status: string;
}

function publicUserView(user: PublicUserRecord) {
  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    name: user.name,
    role: user.role,
    status: user.status,
  };
}
