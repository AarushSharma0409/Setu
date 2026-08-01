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

import { AdminAuthService } from "./admin-auth.service";
import { AdminLoginDto } from "./dto/admin-login.dto";
import {
  AdminRecoveryCodeDto,
  AdminTwoFactorChallengeDto,
  AdminTwoFactorEnrollmentConfirmDto,
  AdminTwoFactorVerifyDto,
} from "./dto/admin-totp.dto";
import { readRefreshToken, setRefreshCookie } from "../auth/auth.controller";
import { RefreshDto } from "../auth/dto/refresh.dto";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { RateLimit } from "../common/decorators/rate-limit.decorator";
import { EnvService } from "../common/env/env.service";
import { AdminAuthGuard } from "../common/guards/admin-auth.guard";
import type { AuthenticatedPrincipal } from "../common/guards/authenticated-request";

const ADMIN_REFRESH_COOKIE = "setu_admin_refresh";

@Controller("admin/auth")
export class AdminAuthController {
  constructor(
    private readonly adminAuthService: AdminAuthService,
    private readonly envService: EnvService,
  ) {}

  @Post("login")
  @RateLimit({ key: "admin-login", limit: 10, windowSeconds: 60 })
  login(@Body() dto: AdminLoginDto) {
    return this.adminAuthService.login(dto.email, dto.password);
  }

  @Post("2fa/enrollment/start")
  @RateLimit({ key: "admin-2fa", limit: 10, windowSeconds: 300 })
  enrollmentStart(@Body() dto: AdminTwoFactorChallengeDto) {
    return this.adminAuthService.startEnrollment(dto.challengeToken);
  }

  @Post("2fa/enrollment/confirm")
  @RateLimit({ key: "admin-2fa", limit: 10, windowSeconds: 300 })
  async enrollmentConfirm(
    @Body() dto: AdminTwoFactorEnrollmentConfirmDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.adminAuthService.confirmEnrollment(
      dto.challengeToken,
      dto.code,
    );
    setRefreshCookie(
      response,
      ADMIN_REFRESH_COOKIE,
      result.refreshToken,
      this.envService.isProduction,
    );
    return result;
  }

  @Post("2fa/verify")
  @RateLimit({ key: "admin-2fa", limit: 10, windowSeconds: 300 })
  async verify(
    @Body() dto: AdminTwoFactorVerifyDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.adminAuthService.verifyTwoFactor(
      dto.challengeToken,
      dto.code,
    );
    setRefreshCookie(
      response,
      ADMIN_REFRESH_COOKIE,
      result.refreshToken,
      this.envService.isProduction,
    );
    return result;
  }

  @Post("2fa/recovery")
  @RateLimit({ key: "admin-recovery", limit: 5, windowSeconds: 300 })
  async recovery(
    @Body() dto: AdminRecoveryCodeDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.adminAuthService.verifyRecoveryCode(
      dto.challengeToken,
      dto.code,
    );
    setRefreshCookie(
      response,
      ADMIN_REFRESH_COOKIE,
      result.refreshToken,
      this.envService.isProduction,
    );
    return result;
  }

  @Post("refresh")
  @RateLimit({ key: "admin-refresh", limit: 20, windowSeconds: 60 })
  async refresh(
    @Body() dto: RefreshDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.adminAuthService.refresh(
      readRefreshToken(request, ADMIN_REFRESH_COOKIE, dto.refreshToken),
    );
    setRefreshCookie(
      response,
      ADMIN_REFRESH_COOKIE,
      result.refreshToken,
      this.envService.isProduction,
    );
    return result;
  }

  @Post("logout")
  async logout(
    @Body() dto: RefreshDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.adminAuthService.logout(
      readRefreshToken(request, ADMIN_REFRESH_COOKIE, dto.refreshToken),
    );
    response.clearCookie(ADMIN_REFRESH_COOKIE);
    return { ok: true };
  }

  @Get("me")
  @UseGuards(AdminAuthGuard)
  me(@CurrentUser() admin: AuthenticatedPrincipal) {
    return this.adminAuthService.me(admin.sub);
  }
}
