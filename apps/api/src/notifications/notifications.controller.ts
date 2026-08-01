import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";

import { NotificationsService } from "./notifications.service";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { RateLimit } from "../common/decorators/rate-limit.decorator";
import type { AuthenticatedPrincipal } from "../common/guards/authenticated-request";
import { PublicUserAuthGuard } from "../common/guards/public-user-auth.guard";

@Controller("notifications")
@UseGuards(PublicUserAuthGuard)
@RateLimit({ key: "notifications", limit: 60, windowSeconds: 60 })
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
  ) {
    return this.notifications.list(
      user,
      boundedNumber(page, 1),
      boundedNumber(pageSize, 20, 50),
    );
  }

  @Get("unread-count")
  unreadCount(@CurrentUser() user: AuthenticatedPrincipal) {
    return this.notifications.unreadCount(user);
  }

  @Post(":notificationId/read")
  markRead(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Param("notificationId", ParseUUIDPipe) id: string,
  ) {
    return this.notifications.markRead(user, id);
  }

  @Post("read-all")
  markAllRead(@CurrentUser() user: AuthenticatedPrincipal) {
    return this.notifications.markAllRead(user);
  }
}

function boundedNumber(value: string | undefined, fallback: number, max = 50) {
  const parsed = Number(value ?? fallback);
  return Number.isInteger(parsed)
    ? Math.min(Math.max(parsed, 1), max)
    : fallback;
}
