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
import { readRefreshToken, setRefreshCookie } from "../auth/auth.controller";
import { AdminLoginDto } from "./dto/admin-login.dto";
import { RefreshDto } from "../auth/dto/refresh.dto";
import { CurrentUser } from "../common/decorators/current-user.decorator";
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
  async login(
    @Body() dto: AdminLoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.adminAuthService.login(dto.email, dto.password);
    const refreshToken =
      "refreshToken" in result ? result.refreshToken : undefined;

    if (refreshToken) {
      setRefreshCookie(
        response,
        ADMIN_REFRESH_COOKIE,
        refreshToken,
        this.envService.isProduction,
      );
    }

    return result;
  }

  @Post("refresh")
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
    return { admin };
  }
}
