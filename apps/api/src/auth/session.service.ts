import { Injectable, UnauthorizedException } from "@nestjs/common";
import { Prisma, SessionSubjectType } from "@prisma/client";

import { TokenService } from "./token.service";
import { PrismaService } from "../database/prisma.service";

export interface CreatedSession {
  refreshToken: string;
  sessionId: string;
}

export interface RotatedSession {
  refreshToken: string;
  subjectId: string;
  sessionId: string;
}

@Injectable()
export class SessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
  ) {}

  async createPublicSession(userId: string): Promise<CreatedSession> {
    const refreshToken = this.tokenService.createRefreshToken();
    const session = await this.prisma.refreshSession.create({
      data: {
        subjectType: SessionSubjectType.USER,
        userId,
        tokenHash: this.tokenService.hashRefreshToken(refreshToken),
        tokenFamily: this.tokenService.createTokenFamily(),
        expiresAt: this.tokenService.refreshExpiresAt(),
      },
    });

    return { refreshToken, sessionId: session.id };
  }

  async createAdminSession(adminUserId: string): Promise<CreatedSession> {
    const refreshToken = this.tokenService.createRefreshToken();
    const session = await this.prisma.refreshSession.create({
      data: {
        subjectType: SessionSubjectType.ADMIN,
        adminUserId,
        tokenHash: this.tokenService.hashRefreshToken(refreshToken),
        tokenFamily: this.tokenService.createTokenFamily(),
        expiresAt: this.tokenService.refreshExpiresAt(),
      },
    });

    return { refreshToken, sessionId: session.id };
  }

  async rotate(
    refreshToken: string,
    subjectType: SessionSubjectType,
  ): Promise<RotatedSession> {
    const tokenHash = this.tokenService.hashRefreshToken(refreshToken);
    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.refreshSession.findUnique({
        where: { tokenHash },
      });

      if (
        !existing ||
        existing.subjectType !== subjectType ||
        existing.expiresAt <= now
      ) {
        throw new UnauthorizedException("Invalid refresh token");
      }

      if (existing.revokedAt) {
        await tx.refreshSession.updateMany({
          where: { tokenFamily: existing.tokenFamily },
          data: { revokedAt: now, reuseDetectedAt: now },
        });
        throw new UnauthorizedException("Invalid refresh token");
      }

      const nextRefreshToken = this.tokenService.createRefreshToken();
      const next = await tx.refreshSession.create({
        data: {
          subjectType,
          userId: existing.userId,
          adminUserId: existing.adminUserId,
          tokenHash: this.tokenService.hashRefreshToken(nextRefreshToken),
          tokenFamily: existing.tokenFamily,
          expiresAt: this.tokenService.refreshExpiresAt(),
        },
      });

      await tx.refreshSession.update({
        where: { id: existing.id },
        data: {
          revokedAt: now,
          replacedBySessionId: next.id,
        },
      });

      const subjectId =
        subjectType === SessionSubjectType.USER
          ? existing.userId
          : existing.adminUserId;

      if (!subjectId) {
        throw new UnauthorizedException("Invalid refresh token");
      }

      return {
        refreshToken: nextRefreshToken,
        subjectId,
        sessionId: next.id,
      };
    });
  }

  async revoke(refreshToken: string): Promise<void> {
    await this.prisma.refreshSession.updateMany({
      where: {
        tokenHash: this.tokenService.hashRefreshToken(refreshToken),
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  async revokeAllForAdmin(
    adminUserId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const client = tx ?? this.prisma;
    await client.refreshSession.updateMany({
      where: { adminUserId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
