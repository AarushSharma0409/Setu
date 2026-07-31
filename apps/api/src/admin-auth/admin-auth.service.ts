import { Injectable, UnauthorizedException } from "@nestjs/common";
import { AccountStatus, SessionSubjectType } from "@prisma/client";

import { PasswordService } from "../auth/password.service";
import { SessionService } from "../auth/session.service";
import { TokenService } from "../auth/token.service";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly passwordService: PasswordService,
    private readonly prisma: PrismaService,
    private readonly sessionService: SessionService,
    private readonly tokenService: TokenService,
  ) {}

  async login(email: string, password: string) {
    const admin = await this.prisma.adminUser.findUnique({ where: { email } });

    if (
      !admin ||
      !(await this.passwordService.verify(password, admin.passwordHash))
    ) {
      throw new UnauthorizedException("Invalid credentials");
    }

    if (admin.status !== AccountStatus.ACTIVE) {
      throw new UnauthorizedException("Invalid credentials");
    }

    if (admin.twoFactorEnabled) {
      return {
        twoFactorRequired: true,
        message:
          "Admin two-factor verification enforcement point. Full 2FA is planned after Sprint 1.",
      };
    }

    const session = await this.sessionService.createAdminSession(admin.id);

    return {
      accessToken: await this.tokenService.signAccessToken({
        sub: admin.id,
        email: admin.email,
        role: admin.role,
        type: "admin",
      }),
      refreshToken: session.refreshToken,
      admin: adminView(admin),
      twoFactorRequired: false,
    };
  }

  async refresh(refreshToken: string | undefined) {
    if (!refreshToken) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const rotated = await this.sessionService.rotate(
      refreshToken,
      SessionSubjectType.ADMIN,
    );
    const admin = await this.prisma.adminUser.findUnique({
      where: { id: rotated.subjectId },
    });

    if (!admin || admin.status !== AccountStatus.ACTIVE) {
      throw new UnauthorizedException("Authentication required");
    }

    return {
      accessToken: await this.tokenService.signAccessToken({
        sub: admin.id,
        email: admin.email,
        role: admin.role,
        type: "admin",
      }),
      refreshToken: rotated.refreshToken,
      admin: adminView(admin),
    };
  }

  async logout(refreshToken: string | undefined): Promise<void> {
    if (refreshToken) {
      await this.sessionService.revoke(refreshToken);
    }
  }
}

interface AdminUserRecord {
  id: string;
  email: string;
  role: string;
  status: string;
  twoFactorEnabled: boolean;
}

function adminView(admin: AdminUserRecord) {
  return {
    id: admin.id,
    email: admin.email,
    role: admin.role,
    status: admin.status,
    twoFactorEnabled: admin.twoFactorEnabled,
  };
}
