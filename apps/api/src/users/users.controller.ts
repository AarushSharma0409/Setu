import { Controller, Get, UseGuards } from "@nestjs/common";

import { CurrentUser } from "../common/decorators/current-user.decorator";
import type { AuthenticatedPrincipal } from "../common/guards/authenticated-request";
import { PublicUserAuthGuard } from "../common/guards/public-user-auth.guard";

@Controller("users")
export class UsersController {
  @Get("me")
  @UseGuards(PublicUserAuthGuard)
  me(@CurrentUser() user: AuthenticatedPrincipal) {
    return { user };
  }
}
