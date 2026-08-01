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
import { DevLoginDto } from "./dto/dev-login.dto";
import { RefreshDto } from "./dto/refresh.dto";
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

  @Post("dev-login")
  @RateLimit({ key: "public-login", limit: 20, windowSeconds: 60 })
  async devLogin(
    @Body() dto: DevLoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.devLogin(dto);
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
