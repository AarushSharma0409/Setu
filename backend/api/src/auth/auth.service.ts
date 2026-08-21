import { createHash, createPublicKey, randomBytes, verify } from "node:crypto";

import {
  BadRequestException,
  ConflictException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { AccountStatus, SessionSubjectType, UserRole } from "@prisma/client";

import { EnvService } from "../common/env/env.service";
import { PrismaService } from "../database/prisma.service";
import { MailService } from "../mail/mail.service";
import type { LoginDto } from "./dto/login.dto";
import type {
  RequestPasswordResetDto,
  ResetPasswordDto,
} from "./dto/password-reset.dto";
import type { VerifyPhoneOtpDto } from "./dto/phone-otp.dto";
import type { RegisterDto } from "./dto/register.dto";
import { PasswordService } from "./password.service";
import { SessionService } from "./session.service";
import { TokenService } from "./token.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly sessionService: SessionService,
    private readonly tokenService: TokenService,
    private readonly env: EnvService,
    private readonly mail: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email?.trim().toLowerCase();
    const phone = dto.phone ? normalizePhone(dto.phone) : undefined;
    if (!email && !phone) {
      throw new BadRequestException(
        "Provide an email address or mobile number",
      );
    }

    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email }, { phone }] },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException(
        "Unable to create account with these details",
      );
    }

    const user = await this.prisma.user.create({
      data: {
        email,
        phone,
        name: dto.name.trim(),
        passwordHash: await this.passwordService.hash(dto.password),
        role: UserRole.USER,
        status: AccountStatus.ACTIVE,
      },
    });

    return this.createAuthenticatedSession(user);
  }

  async login(dto: LoginDto) {
    const identifier = dto.identifier.trim();
    const user = await this.prisma.user.findFirst({
      where: identifier.includes("@")
        ? { email: identifier.toLowerCase() }
        : { phone: normalizePhone(identifier) },
    });

    if (
      !user ||
      !user.passwordHash ||
      user.status !== AccountStatus.ACTIVE ||
      !(await this.passwordService.verify(dto.password, user.passwordHash))
    ) {
      throw new UnauthorizedException("Invalid email or password");
    }

    return this.createAuthenticatedSession(user);
  }

  private async createAuthenticatedSession(user: PublicUserRecord) {
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

  async requestPasswordReset(dto: RequestPasswordResetDto): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.trim().toLowerCase() },
      select: { id: true, email: true, name: true },
    });
    if (!user?.email || !this.mail.isConfigured()) return;

    const token = randomBytes(32).toString("base64url");
    await this.prisma.passwordResetToken.deleteMany({
      where: { userId: user.id, usedAt: null },
    });
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashResetToken(token),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      },
    });

    const resetUrl = `${publicWebUrl(this.env.values.PUBLIC_WEB_URL)}/auth?mode=reset&token=${encodeURIComponent(token)}`;
    await this.mail.send({
      event: "password_reset_requested",
      to: user.email,
      subject: "Reset your Setu password",
      title: "Reset your password",
      body: `Hello ${user.name ?? "there"},\n\nWe received a request to reset the password for your Setu account. This link expires in 30 minutes. If you did not request this, you can safely ignore this email.`,
      cta: { label: "Reset password", url: resetUrl },
    });
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const now = new Date();
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashResetToken(dto.token) },
      select: {
        id: true,
        userId: true,
        expiresAt: true,
        usedAt: true,
        user: { select: { email: true, name: true } },
      },
    });
    if (!record || record.usedAt || record.expiresAt <= now) {
      throw new BadRequestException(
        "This password reset link is invalid or expired",
      );
    }

    await this.prisma.$transaction(async (tx) => {
      const used = await tx.passwordResetToken.updateMany({
        where: { id: record.id, usedAt: null },
        data: { usedAt: now },
      });
      if (used.count !== 1) {
        throw new BadRequestException(
          "This password reset link is invalid or expired",
        );
      }
      await tx.user.update({
        where: { id: record.userId },
        data: { passwordHash: await this.passwordService.hash(dto.password) },
      });
      await tx.refreshSession.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: now },
      });
    });
    await this.mail.send({
      event: "password_changed",
      to: record.user.email,
      subject: "Your Setu password was changed",
      title: "Your password was changed",
      body: `Hello ${record.user.name ?? "there"},\n\nYour Setu account password was successfully changed. If you made this change, no further action is required. If you did not make this change, contact Setu support immediately.`,
      cta: { label: "Open Setu", url: this.mail.publicUrl("/") },
    });
  }

  async signInWithGoogleIdToken(idToken: string) {
    const clientId = this.googleClientId();
    const identity = await verifyGoogleIdToken(idToken, clientId);
    const user = await this.prisma.user.upsert({
      where: { email: identity.email },
      create: {
        email: identity.email,
        name: identity.name,
        role: UserRole.USER,
        status: AccountStatus.ACTIVE,
      },
      update: { name: identity.name ?? undefined },
    });
    return this.createAuthenticatedSession(user);
  }

  async requestPhoneOtp(phone: string): Promise<void> {
    const config = this.msg91Configuration();
    const mobile = msg91MobileNumber(phone);
    const requestUrl = new URL("https://control.msg91.com/api/v5/otp");
    requestUrl.searchParams.set("mobile", mobile);
    requestUrl.searchParams.set("authkey", config.authKey);
    requestUrl.searchParams.set("template_id", config.templateId);
    const response = await fetch(requestUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    if (!response.ok) {
      throw new ServiceUnavailableException(
        "We could not send an OTP right now. Please try again shortly.",
      );
    }
  }

  async verifyPhoneOtp(dto: VerifyPhoneOtpDto) {
    const config = this.msg91Configuration();
    const phone = normalizePhone(dto.phone);
    const verificationUrl = new URL(
      "https://control.msg91.com/api/v5/otp/verify",
    );
    verificationUrl.searchParams.set("mobile", msg91MobileNumber(phone));
    verificationUrl.searchParams.set("otp", dto.otp);
    const response = await fetch(verificationUrl, {
      headers: { authkey: config.authKey },
    });
    if (!response.ok || !(await msg91OtpVerified(response))) {
      throw new UnauthorizedException("The OTP is invalid or has expired");
    }

    const existing = await this.prisma.user.findUnique({ where: { phone } });
    if (existing) {
      if (existing.status !== AccountStatus.ACTIVE) {
        throw new UnauthorizedException("Account access is unavailable");
      }
      if (!existing.phoneVerified) {
        await this.prisma.user.update({
          where: { id: existing.id },
          data: { phoneVerified: true },
        });
      }
      return this.createAuthenticatedSession(existing);
    }
    if (!dto.createAccount || !dto.name?.trim()) {
      throw new UnauthorizedException(
        "No account exists for this mobile number",
      );
    }
    const user = await this.prisma.user.create({
      data: {
        name: dto.name.trim(),
        phone,
        phoneVerified: true,
        role: UserRole.USER,
        status: AccountStatus.ACTIVE,
      },
    });
    return this.createAuthenticatedSession(user);
  }

  private googleClientId(): string {
    if (!this.env.values.GOOGLE_OAUTH_CLIENT_ID) {
      throw new ServiceUnavailableException("Google sign-in is not configured");
    }
    return this.env.values.GOOGLE_OAUTH_CLIENT_ID;
  }

  private msg91Configuration() {
    const { MSG91_AUTH_KEY, MSG91_OTP_ENABLED, MSG91_OTP_TEMPLATE_ID } =
      this.env.values;
    if (!MSG91_OTP_ENABLED || !MSG91_AUTH_KEY || !MSG91_OTP_TEMPLATE_ID) {
      throw new ServiceUnavailableException(
        "Mobile OTP sign-in is not configured",
      );
    }
    return { authKey: MSG91_AUTH_KEY, templateId: MSG91_OTP_TEMPLATE_ID };
  }
}

function normalizePhone(input: string): string {
  const digits = input.replace(/[^\d+]/g, "");
  if (/^\d{10}$/.test(digits)) return `+91${digits}`;
  if (/^91\d{10}$/.test(digits)) return `+${digits}`;
  return digits.startsWith("+") ? digits : `+${digits}`;
}

function msg91MobileNumber(phone: string): string {
  return normalizePhone(phone).replace(/^\+/, "");
}

async function msg91OtpVerified(response: Response): Promise<boolean> {
  try {
    const body = (await response.json()) as { type?: string; message?: string };
    return body.type === "success" || /verified/i.test(body.message ?? "");
  } catch {
    return false;
  }
}

function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function publicWebUrl(value: string | undefined): string {
  return value ?? "http://localhost:3000";
}

async function verifyGoogleIdToken(token: string, audience: string) {
  const [headerPart, payloadPart, signaturePart] = token.split(".");
  if (!headerPart || !payloadPart || !signaturePart) {
    throw new UnauthorizedException("Google sign-in could not be completed");
  }
  const header = JSON.parse(
    Buffer.from(headerPart, "base64url").toString("utf8"),
  ) as {
    alg?: string;
    kid?: string;
  };
  const payload = JSON.parse(
    Buffer.from(payloadPart, "base64url").toString("utf8"),
  ) as {
    aud?: string;
    email?: string;
    email_verified?: boolean | string;
    exp?: number;
    iss?: string;
    name?: string;
    sub?: string;
  };
  if (header.alg !== "RS256" || !header.kid) {
    throw new UnauthorizedException("Google sign-in could not be completed");
  }
  const keySetResponse = await fetch(
    "https://www.googleapis.com/oauth2/v3/certs",
  );
  const keySet = (await keySetResponse.json()) as { keys?: GoogleJwk[] };
  const jwk = keySet.keys?.find((key) => key.kid === header.kid);
  const isValidSignature =
    jwk &&
    verify(
      "RSA-SHA256",
      Buffer.from(`${headerPart}.${payloadPart}`),
      createPublicKey({ key: jwk as NodeJwk, format: "jwk" }),
      Buffer.from(signaturePart, "base64url"),
    );
  const issuerIsGoogle =
    payload.iss === "https://accounts.google.com" ||
    payload.iss === "accounts.google.com";
  if (
    !isValidSignature ||
    payload.aud !== audience ||
    !issuerIsGoogle ||
    !payload.exp ||
    payload.exp * 1000 <= Date.now() ||
    !payload.sub ||
    !payload.email ||
    payload.email_verified !== true
  ) {
    throw new UnauthorizedException("Google sign-in could not be completed");
  }
  return {
    email: payload.email.toLowerCase(),
    name: payload.name?.trim() || null,
    subject: payload.sub,
  };
}

interface GoogleJwk {
  alg?: string;
  e: string;
  kid?: string;
  kty: "RSA";
  n: string;
  use?: string;
}

interface NodeJwk extends GoogleJwk {
  [key: string]: string | undefined;
}

interface PublicUserRecord {
  id: string;
  email: string | null;
  phone: string | null;
  name: string | null;
  passwordHash?: string | null;
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
