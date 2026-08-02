import { randomUUID } from "node:crypto";

import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import {
  AccountStatus,
  AdminAuthChallengeType,
  SessionSubjectType,
} from "@prisma/client";
import bcrypt from "bcryptjs";

import { AdminTwoFactorEncryptionService } from "./two-factor/encryption.service";
import { AdminTotpService } from "./two-factor/totp.service";
import { AuditService } from "../audit/audit.service";
import { PasswordService } from "../auth/password.service";
import { SessionService } from "../auth/session.service";
import { parseDurationMs, TokenService } from "../auth/token.service";
import { EnvService } from "../common/env/env.service";
import { PrismaService } from "../database/prisma.service";

const GENERIC_AUTH_ERROR = "Invalid credentials";

@Injectable()
export class AdminAuthService {
  private readonly logger = new Logger(AdminAuthService.name);

  constructor(
    private readonly passwordService: PasswordService,
    private readonly prisma: PrismaService,
    private readonly sessionService: SessionService,
    private readonly tokenService: TokenService,
    private readonly envService: EnvService,
    private readonly encryptionService: AdminTwoFactorEncryptionService,
    private readonly totpService: AdminTotpService,
    private readonly auditService: AuditService,
  ) {}

  async login(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const admin = await this.prisma.adminUser.findUnique({
      where: { email: normalizedEmail },
    });

    if (!admin) {
      throw new UnauthorizedException(GENERIC_AUTH_ERROR);
    }

    if (admin.lockedUntil && admin.lockedUntil > new Date()) {
      throw new HttpException(
        "Authentication temporarily unavailable",
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const validPassword = await this.passwordService.verify(
      password,
      admin.passwordHash,
    );

    if (!validPassword || admin.status !== AccountStatus.ACTIVE) {
      await this.recordPasswordFailure(admin.id);
      throw new UnauthorizedException(GENERIC_AUTH_ERROR);
    }

    await this.prisma.adminUser.update({
      where: { id: admin.id },
      data: { failedLoginCount: 0, lockedUntil: null },
    });
    await this.auditService.record({
      adminUserId: admin.id,
      action: "ADMIN_LOGIN_PASSWORD_SUCCEEDED",
      entityType: "AdminUser",
      entityId: admin.id,
    });

    const challengeType =
      admin.twoFactorEnabled && admin.twoFactorSecretEncrypted
        ? AdminAuthChallengeType.TOTP_VERIFY
        : AdminAuthChallengeType.TOTP_ENROLLMENT;
    const challenge = await this.createChallenge(admin.id, challengeType);

    return {
      challengeToken: challenge.token,
      nextStep:
        challengeType === AdminAuthChallengeType.TOTP_VERIFY
          ? "TOTP_REQUIRED"
          : "TOTP_ENROLLMENT_REQUIRED",
    } as const;
  }

  async startEnrollment(challengeToken: string) {
    const challenge = await this.readChallenge(
      challengeToken,
      AdminAuthChallengeType.TOTP_ENROLLMENT,
    );
    const admin = await this.requireActiveAdmin(challenge.adminUserId);

    if (admin.twoFactorEnabled && admin.twoFactorSecretEncrypted) {
      throw new ConflictException(
        "Two-factor authentication is already enabled",
      );
    }

    const secret = challenge.pendingSecretEncrypted
      ? this.encryptionService.decrypt(challenge.pendingSecretEncrypted)
      : this.totpService.generateSecret();

    if (!challenge.pendingSecretEncrypted) {
      await this.prisma.adminAuthChallenge.update({
        where: { id: challenge.id },
        data: {
          pendingSecretEncrypted: this.encryptionService.encrypt(secret),
        },
      });
      await this.auditService.record({
        adminUserId: admin.id,
        action: "ADMIN_2FA_ENROLLMENT_STARTED",
        entityType: "AdminUser",
        entityId: admin.id,
      });
    }

    return {
      challengeToken,
      secret,
      otpauthUri: this.totpService.enrollmentUri(admin.email, secret),
    };
  }

  async confirmEnrollment(challengeToken: string, code: string) {
    const challenge = await this.readChallenge(
      challengeToken,
      AdminAuthChallengeType.TOTP_ENROLLMENT,
    );
    const admin = await this.requireActiveAdmin(challenge.adminUserId);

    if (!challenge.pendingSecretEncrypted) {
      this.logChallengeFailure("enrollment_secret_missing");
      throw new UnauthorizedException("Enrollment is not ready");
    }

    const secret = this.encryptionService.decrypt(
      challenge.pendingSecretEncrypted,
    );
    if (!this.totpService.verify(code, secret)) {
      this.logChallengeFailure("totp_invalid");
      await this.recordSecondFactorFailure(admin.id);
      await this.auditService.record({
        adminUserId: admin.id,
        action: "ADMIN_2FA_VERIFICATION_FAILED",
        entityType: "AdminUser",
        entityId: admin.id,
      });
      throw new UnauthorizedException("Invalid two-factor code");
    }

    const recoveryCodes = createRecoveryCodes();
    const recoveryCodeRecords = await Promise.all(
      recoveryCodes.map(async (recoveryCode) => ({
        adminUserId: admin.id,
        codeHash: await bcrypt.hash(recoveryCode, 12),
      })),
    );
    await this.prisma.$transaction(async (tx) => {
      const consumed = await tx.adminAuthChallenge.updateMany({
        where: {
          id: challenge.id,
          tokenHash: this.tokenService.hashChallengeToken(challengeToken),
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: { usedAt: new Date() },
      });

      if (consumed.count !== 1) {
        throw new UnauthorizedException("Authentication challenge expired");
      }

      await tx.adminUser.update({
        where: { id: admin.id },
        data: {
          twoFactorEnabled: true,
          twoFactorSecretEncrypted: this.encryptionService.encrypt(secret),
          twoFactorSecretKeyVersion: 1,
          twoFactorConfirmedAt: new Date(),
          lastLoginAt: new Date(),
          failedLoginCount: 0,
          lockedUntil: null,
        },
      });
      await tx.adminRecoveryCode.deleteMany({
        where: { adminUserId: admin.id },
      });
      await tx.adminRecoveryCode.createMany({ data: recoveryCodeRecords });
      await tx.auditLog.create({
        data: {
          adminUserId: admin.id,
          action: "ADMIN_2FA_ENABLED",
          entityType: "AdminUser",
          entityId: admin.id,
          metadata: { recoveryCodeCount: recoveryCodes.length },
        },
      });
    });

    return {
      ...(await this.issueCredentials(admin.id)),
      recoveryCodes,
    };
  }

  async verifyTwoFactor(challengeToken: string, code: string) {
    const challenge = await this.readChallenge(
      challengeToken,
      AdminAuthChallengeType.TOTP_VERIFY,
    );
    const admin = await this.requireActiveAdmin(challenge.adminUserId);
    const secretEnvelope = admin.twoFactorSecretEncrypted;

    if (!secretEnvelope || !admin.twoFactorEnabled) {
      throw new UnauthorizedException(GENERIC_AUTH_ERROR);
    }

    if (
      !this.totpService.verify(
        code,
        this.encryptionService.decrypt(secretEnvelope),
      )
    ) {
      await this.recordSecondFactorFailure(admin.id);
      await this.auditService.record({
        adminUserId: admin.id,
        action: "ADMIN_2FA_VERIFICATION_FAILED",
        entityType: "AdminUser",
        entityId: admin.id,
      });
      throw new UnauthorizedException("Invalid two-factor code");
    }

    await this.consumeChallenge(challenge, challengeToken);
    await this.prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date(), failedLoginCount: 0, lockedUntil: null },
    });
    await this.auditService.record({
      adminUserId: admin.id,
      action: "ADMIN_2FA_VERIFICATION_SUCCEEDED",
      entityType: "AdminUser",
      entityId: admin.id,
    });

    return this.issueCredentials(admin.id);
  }

  async verifyRecoveryCode(challengeToken: string, code: string) {
    const challenge = await this.readChallenge(
      challengeToken,
      AdminAuthChallengeType.TOTP_VERIFY,
    );
    const admin = await this.requireActiveAdmin(challenge.adminUserId);
    const normalizedCode = code.trim().toLowerCase();
    const candidates = await this.prisma.adminRecoveryCode.findMany({
      where: { adminUserId: admin.id, usedAt: null },
    });
    let matchedId: string | undefined;
    for (const candidate of candidates) {
      if (await bcrypt.compare(normalizedCode, candidate.codeHash)) {
        matchedId = candidate.id;
        break;
      }
    }

    if (!matchedId) {
      await this.recordSecondFactorFailure(admin.id);
      await this.auditService.record({
        adminUserId: admin.id,
        action: "ADMIN_2FA_VERIFICATION_FAILED",
        entityType: "AdminUser",
        entityId: admin.id,
      });
      throw new UnauthorizedException("Invalid recovery code");
    }

    await this.prisma.$transaction(async (tx) => {
      const consumedCode = await tx.adminRecoveryCode.updateMany({
        where: { id: matchedId, usedAt: null },
        data: { usedAt: new Date() },
      });
      if (consumedCode.count !== 1) {
        throw new UnauthorizedException("Invalid recovery code");
      }
      const consumedChallenge = await tx.adminAuthChallenge.updateMany({
        where: {
          id: challenge.id,
          tokenHash: this.tokenService.hashChallengeToken(challengeToken),
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: { usedAt: new Date() },
      });
      if (consumedChallenge.count !== 1) {
        throw new UnauthorizedException("Authentication challenge expired");
      }
      await tx.adminUser.update({
        where: { id: admin.id },
        data: {
          lastLoginAt: new Date(),
          failedLoginCount: 0,
          lockedUntil: null,
        },
      });
      await tx.auditLog.create({
        data: {
          adminUserId: admin.id,
          action: "ADMIN_RECOVERY_CODE_USED",
          entityType: "AdminUser",
          entityId: admin.id,
        },
      });
    });

    return this.issueCredentials(admin.id);
  }

  async refresh(refreshToken: string | undefined) {
    if (!refreshToken) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const rotated = await this.sessionService.rotate(
      refreshToken,
      SessionSubjectType.ADMIN,
    );
    const admin = await this.requireActiveAdmin(rotated.subjectId);

    if (!admin.twoFactorEnabled || !admin.twoFactorSecretEncrypted) {
      throw new UnauthorizedException("Authentication required");
    }

    return {
      ...(await this.issueCredentials(admin.id)),
      refreshToken: rotated.refreshToken,
    };
  }

  async logout(refreshToken: string | undefined): Promise<void> {
    if (refreshToken) {
      const session = await this.prisma.refreshSession.findUnique({
        where: { tokenHash: this.tokenService.hashRefreshToken(refreshToken) },
        select: { adminUserId: true },
      });
      await this.sessionService.revoke(refreshToken);
      if (session?.adminUserId) {
        await this.auditService.record({
          adminUserId: session.adminUserId,
          action: "ADMIN_LOGOUT",
          entityType: "AdminUser",
          entityId: session.adminUserId,
        });
      }
    }
  }

  async me(adminId: string) {
    const admin = await this.requireActiveAdmin(adminId);
    return { admin: adminView(admin) };
  }

  private async issueCredentials(adminId: string) {
    const admin = await this.requireActiveAdmin(adminId);

    if (!admin.twoFactorEnabled || !admin.twoFactorSecretEncrypted) {
      throw new UnauthorizedException("Authentication required");
    }

    const session = await this.sessionService.createAdminSession(admin.id);

    return {
      accessToken: await this.tokenService.signAccessToken({
        sub: admin.id,
        email: admin.email,
        role: admin.role,
        type: "admin",
        mfa: true,
        amr: ["pwd", "otp"],
      }),
      refreshToken: session.refreshToken,
      admin: adminView(admin),
    };
  }

  private async createChallenge(
    adminUserId: string,
    type: AdminAuthChallengeType,
  ) {
    const challengeId = randomUUID();
    const token = await this.tokenService.signAdminChallenge({
      sub: adminUserId,
      challengeId,
      challengeType: type,
    });

    await this.prisma.$transaction([
      this.prisma.adminAuthChallenge.updateMany({
        where: { adminUserId, type, usedAt: null },
        data: { usedAt: new Date() },
      }),
      this.prisma.adminAuthChallenge.create({
        data: {
          id: challengeId,
          adminUserId,
          type,
          tokenHash: this.tokenService.hashChallengeToken(token),
          expiresAt: new Date(
            Date.now() +
              parseDurationMs(this.envService.values.ADMIN_AUTH_CHALLENGE_TTL),
          ),
        },
      }),
    ]);

    return { id: challengeId, token };
  }

  private async readChallenge(token: string, type: AdminAuthChallengeType) {
    let payload;
    try {
      payload = await this.tokenService.verifyAdminChallenge(token);
    } catch {
      this.logChallengeFailure("token_invalid");
      throw new UnauthorizedException("Authentication challenge expired");
    }

    if (payload.challengeType !== type) {
      this.logChallengeFailure("type_mismatch");
      throw new UnauthorizedException("Authentication challenge expired");
    }

    const challenge = await this.prisma.adminAuthChallenge.findFirst({
      where: {
        id: payload.challengeId,
        adminUserId: payload.sub,
        type,
        tokenHash: this.tokenService.hashChallengeToken(token),
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!challenge) {
      this.logChallengeFailure("database_miss_or_expired");
      throw new UnauthorizedException("Authentication challenge expired");
    }

    return challenge;
  }

  private logChallengeFailure(reason: string): void {
    if (!this.envService.isProduction) {
      this.logger.warn(`Admin auth challenge rejected: ${reason}`);
    }
  }

  private async consumeChallenge(
    challenge: { id: string },
    token: string,
  ): Promise<void> {
    const result = await this.prisma.adminAuthChallenge.updateMany({
      where: {
        id: challenge.id,
        tokenHash: this.tokenService.hashChallengeToken(token),
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { usedAt: new Date() },
    });

    if (result.count !== 1) {
      throw new UnauthorizedException("Authentication challenge expired");
    }
  }

  private async requireActiveAdmin(adminId: string) {
    const admin = await this.prisma.adminUser.findUnique({
      where: { id: adminId },
    });

    if (!admin || admin.status !== AccountStatus.ACTIVE) {
      throw new UnauthorizedException(GENERIC_AUTH_ERROR);
    }

    return admin;
  }

  private async recordPasswordFailure(adminId: string) {
    const admin = await this.prisma.adminUser.findUnique({
      where: { id: adminId },
    });
    if (!admin) {
      return;
    }

    const failedLoginCount = admin.failedLoginCount + 1;
    const lockedUntil =
      failedLoginCount >= this.envService.values.ADMIN_LOGIN_MAX_ATTEMPTS
        ? new Date(
            Date.now() +
              this.envService.values.ADMIN_LOGIN_LOCKOUT_SECONDS * 1000,
          )
        : null;
    await this.prisma.adminUser.update({
      where: { id: admin.id },
      data: { failedLoginCount, lockedUntil },
    });
    await this.auditService.record({
      adminUserId: admin.id,
      action: "ADMIN_LOGIN_FAILED",
      entityType: "AdminUser",
      entityId: admin.id,
      metadata: { reason: "invalid_credentials" },
    });
  }

  private async recordSecondFactorFailure(adminId: string) {
    const admin = await this.prisma.adminUser.findUnique({
      where: { id: adminId },
    });
    if (!admin) return;

    const failedLoginCount = admin.failedLoginCount + 1;
    const lockedUntil =
      failedLoginCount >= this.envService.values.ADMIN_2FA_MAX_ATTEMPTS
        ? new Date(
            Date.now() +
              this.envService.values.ADMIN_LOGIN_LOCKOUT_SECONDS * 1000,
          )
        : null;
    await this.prisma.adminUser.update({
      where: { id: admin.id },
      data: { failedLoginCount, lockedUntil },
    });
  }
}

function createRecoveryCodes(): string[] {
  return Array.from(
    { length: 10 },
    () =>
      `${randomUUID().replaceAll("-", "").slice(0, 8)}-${randomUUID()
        .replaceAll("-", "")
        .slice(0, 8)}`,
  );
}

interface AdminUserRecord {
  id: string;
  email: string;
  role: string;
  status: string;
  twoFactorEnabled: boolean;
}

export function adminView(admin: AdminUserRecord) {
  return {
    id: admin.id,
    email: admin.email,
    role: admin.role,
    status: admin.status,
    twoFactorEnabled: admin.twoFactorEnabled,
  };
}
