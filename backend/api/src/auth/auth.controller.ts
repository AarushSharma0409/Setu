import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { Request, Response } from "express";

import { AuthService } from "./auth.service";
import { GoogleIdTokenDto } from "./dto/google-id-token.dto";
import { LoginDto } from "./dto/login.dto";
import {
  RequestPasswordResetDto,
  ResetPasswordDto,
} from "./dto/password-reset.dto";
import { RequestPhoneOtpDto, VerifyPhoneOtpDto } from "./dto/phone-otp.dto";
import { RefreshDto } from "./dto/refresh.dto";
import { RegisterDto } from "./dto/register.dto";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { RateLimit } from "../common/decorators/rate-limit.decorator";
import { EnvService } from "../common/env/env.service";
import type { AuthenticatedPrincipal } from "../common/guards/authenticated-request";
import { PublicUserAuthGuard } from "../common/guards/public-user-auth.guard";

const PUBLIC_REFRESH_COOKIE = "setu_refresh";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly envService: EnvService,
  ) {}

  @Post("register")
  @RateLimit({ key: "public-register", limit: 5, windowSeconds: 60 })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.register(dto);
    setRefreshCookie(
      response,
      PUBLIC_REFRESH_COOKIE,
      result.refreshToken,
      this.envService.isProduction,
    );

    return result;
  }

  @Post("login")
  @RateLimit({ key: "public-login", limit: 10, windowSeconds: 60 })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(dto);
    setRefreshCookie(
      response,
      PUBLIC_REFRESH_COOKIE,
      result.refreshToken,
      this.envService.isProduction,
    );

    return result;
  }

  @Post("refresh")
  @RateLimit({ key: "public-refresh", limit: 30, windowSeconds: 60 })
  async refresh(
    @Body() dto: RefreshDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.refresh(
      readRefreshToken(request, PUBLIC_REFRESH_COOKIE, dto.refreshToken),
    );
    setRefreshCookie(
      response,
      PUBLIC_REFRESH_COOKIE,
      result.refreshToken,
      this.envService.isProduction,
    );

    return result;
  }

  @Post("logout")
  @RateLimit({ key: "public-logout", limit: 30, windowSeconds: 60 })
  async logout(
    @Body() dto: RefreshDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.logout(
      readRefreshToken(request, PUBLIC_REFRESH_COOKIE, dto.refreshToken),
    );
    response.clearCookie(PUBLIC_REFRESH_COOKIE);

    return { ok: true };
  }

  @Post("password-reset/request")
  @RateLimit({ key: "password-reset-request", limit: 3, windowSeconds: 3600 })
  async requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    await this.authService.requestPasswordReset(dto);
    return {
      ok: true,
      message:
        "If an account exists for that email address, reset instructions have been sent.",
    };
  }

  @Post("password-reset/confirm")
  @RateLimit({ key: "password-reset-confirm", limit: 5, windowSeconds: 3600 })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto);
    return { ok: true };
  }

  @Post("google/token")
  @RateLimit({ key: "google-token", limit: 10, windowSeconds: 60 })
  async googleToken(
    @Body() dto: GoogleIdTokenDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.signInWithGoogleIdToken(
      dto.credential,
    );
    setRefreshCookie(
      response,
      PUBLIC_REFRESH_COOKIE,
      result.refreshToken,
      this.envService.isProduction,
    );
    return result;
  }

  @Post("phone-otp/request")
  @RateLimit({ key: "phone-otp-request", limit: 3, windowSeconds: 3600 })
  async requestPhoneOtp(@Body() dto: RequestPhoneOtpDto) {
    await this.authService.requestPhoneOtp(dto.phone);
    return { ok: true };
  }

  @Post("phone-otp/verify")
  @RateLimit({ key: "phone-otp-verify", limit: 5, windowSeconds: 3600 })
  async verifyPhoneOtp(
    @Body() dto: VerifyPhoneOtpDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.verifyPhoneOtp(dto);
    setRefreshCookie(
      response,
      PUBLIC_REFRESH_COOKIE,
      result.refreshToken,
      this.envService.isProduction,
    );
    return result;
  }

  @Get("me")
  @UseGuards(PublicUserAuthGuard)
  me(@CurrentUser() user: AuthenticatedPrincipal) {
    return { user };
  }
}

export function readRefreshToken(
  request: Request,
  cookieName: string,
  fallback?: string,
): string | undefined {
  const cookies = request.cookies as
    Record<string, string | undefined> | undefined;
  return cookies?.[cookieName] ?? fallback;
}

export function setRefreshCookie(
  response: Response,
  name: string,
  token: string,
  production: boolean,
) {
  response.cookie(name, token, {
    httpOnly: true,
    secure: production,
    sameSite: production ? "none" : "lax",
    path: "/",
  });
}
