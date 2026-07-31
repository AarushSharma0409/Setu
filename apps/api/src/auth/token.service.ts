import { randomBytes, randomUUID, createHash } from "node:crypto";

import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

import { EnvService } from "../common/env/env.service";
import type { AuthSubjectType } from "../common/guards/authenticated-request";

export interface AccessTokenInput {
  sub: string;
  email?: string;
  phone?: string;
  role: string;
  type: AuthSubjectType;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly envService: EnvService,
  ) {}

  async signAccessToken(input: AccessTokenInput): Promise<string> {
    const audience = input.type === "admin" ? "setu-admin" : "setu-public";

    return this.jwtService.signAsync(input, {
      audience,
      expiresIn: Math.floor(
        parseDurationMs(this.envService.values.ACCESS_TOKEN_TTL) / 1000,
      ),
      secret: this.envService.values.JWT_ACCESS_SECRET,
    });
  }

  createRefreshToken(): string {
    return randomBytes(48).toString("base64url");
  }

  createTokenFamily(): string {
    return randomUUID();
  }

  hashRefreshToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  refreshExpiresAt(): Date {
    return new Date(
      Date.now() + parseDurationMs(this.envService.values.REFRESH_TOKEN_TTL),
    );
  }
}

export function parseDurationMs(value: string): number {
  const match = /^(\d+)([smhd])$/.exec(value);

  if (!match) {
    throw new Error(`Invalid duration: ${value}`);
  }

  const amount = Number(match[1]);
  const unit = match[2];
  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return amount * multipliers[unit as keyof typeof multipliers];
}
